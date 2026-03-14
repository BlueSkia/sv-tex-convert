import {
  parseDds,
  type ParsedDds,
} from '$lib/parsers/dds-parser';
import {
  Caps2Flags,
  DdsPixelFormats,
  DxgiFormats,
} from '$lib/enums/dds';
import {
  TextureFormat,
  TextureType,
} from '$lib/enums/tex';
import { NotSupportedError, NotYetImplementedError } from '$lib/utils/error';

function toTexPixelFormat(ddsInfo: ParsedDds) {
  const fourCC = ddsInfo.header.ddsPixelFormat.fourCC;

  if (fourCC.value === DdsPixelFormats.DXT1) {
    return TextureFormat.DXT1;
  }

  if (fourCC.value === DdsPixelFormats.DXT3) {
    return TextureFormat.DXT3;
  }

  if (fourCC.value === DdsPixelFormats.DXT5) {
    return TextureFormat.DXT5;
  }

  if (fourCC.value === DdsPixelFormats.BC4U) {
    return TextureFormat.ATI1;
  }

  if (fourCC.value === DdsPixelFormats.BC5U) {
    return TextureFormat.ATI2;
  }

  if (ddsInfo.headerDxt10) {
    const { dxgiFormat } = ddsInfo.headerDxt10;

    switch (dxgiFormat.value) {
      case DxgiFormats.DXGI_FORMAT_BC7_UNORM:
        return TextureFormat.BC7;

      case DxgiFormats.DXGI_FORMAT_BC3_UNORM:
        return TextureFormat.DXT5;

      case DxgiFormats.DXGI_FORMAT_BC2_UNORM:
        return TextureFormat.DXT3;

      case DxgiFormats.DXGI_FORMAT_BC1_UNORM:
        return TextureFormat.DXT1;

      case DxgiFormats.DXGI_FORMAT_B8G8R8A8_UNORM:
        return TextureFormat.B8G8R8A8;

      case DxgiFormats.DXGI_FORMAT_R8_UNORM:
        return TextureFormat.L8;

      case DxgiFormats.DXGI_FORMAT_A8_UNORM:
        return TextureFormat.A8;

      case DxgiFormats.DXGI_FORMAT_BC5_UNORM:
        return TextureFormat.ATI2;

      case DxgiFormats.DXGI_FORMAT_BC4_UNORM:
        return TextureFormat.ATI1;

      default:
        throw new NotSupportedError(`Unhandled format ${dxgiFormat.text} (dxgi)`);
    }
  }

  if (fourCC.value === DdsPixelFormats.NONE) {
    const {
      rgbBitCount,
      rBitMask,
      aBitMask,
    } = ddsInfo.header.ddsPixelFormat;

    if (rBitMask === 0x00ff0000) {
      return TextureFormat.B8G8R8A8;
    } else if (rBitMask === 0xff) {
      return TextureFormat.L8;
    } else if (aBitMask === 0xff) {
      return TextureFormat.A8;
    } else if (rgbBitCount === 16) {
      return TextureFormat.B4G4R4A4;
    }
  }

  throw new NotSupportedError(`Unhandled format ${fourCC.value} (fourCC)`);
}

function getTexMipMapLengthFormat(ddsInfo: ParsedDds) {
  const {
    height,
    width,
    ddsPixelFormat: {
      fourCC,
      rBitMask,
    },
  } = ddsInfo.header;

  if (
    fourCC.value === DdsPixelFormats.DXT1 ||
    fourCC.value === DdsPixelFormats.BC4U
  ) {
    return Math.floor((height * width) / 2);
  }

  if (
    fourCC.value === DdsPixelFormats.DXT3 ||
    fourCC.value === DdsPixelFormats.DXT5 ||
    fourCC.value === DdsPixelFormats.BC5U
  ) {
    // return height * width * 2;
    return height * width;
  }

  if (fourCC.value === DdsPixelFormats.NONE) {
    if (rBitMask === 0x00ff0000) {
      return height * width * 4;
    }
    else {
      return height * width;
    }
  }

  if (ddsInfo.headerDxt10) {
    const { dxgiFormat: { value } } = ddsInfo.headerDxt10;

    if (
      value === DxgiFormats.DXGI_FORMAT_BC7_UNORM ||
      value === DxgiFormats.DXGI_FORMAT_BC3_UNORM ||
      value === DxgiFormats.DXGI_FORMAT_BC2_UNORM ||
      value === DxgiFormats.DXGI_FORMAT_B4G4R4A4_UNORM ||
      value === DxgiFormats.DXGI_FORMAT_BC5_UNORM ||
      value === DxgiFormats.DXGI_FORMAT_BC4_UNORM
    ) {
      // return height * width * 2;
      return height * width;
    }

    if (value === DxgiFormats.DXGI_FORMAT_BC1_UNORM) {
      return Math.floor((height * width) / 2);
    }

    if (value === DxgiFormats.DXGI_FORMAT_B8G8R8A8_UNORM) {
      return height * width * 4;
    }

    if (value === DxgiFormats.DXGI_FORMAT_R8_UNORM) {
      return height * width;
    }
  }

  return 0;
}

function getMipMapOffsets(mipMapLength: number, { header }: ParsedDds) {
  const count = header.mipMapCount;

  let minMipSize = 16;
  if (
    header.ddsPixelFormat.fourCC.value === DdsPixelFormats.DXT1 ||
    header.ddsPixelFormat.fourCC.value === DdsPixelFormats.BC4U
  ) {
    minMipSize = 8;
  }

  const offsets = Array(13).fill(0);

  for (let i = 0, len = mipMapLength, offset = 0x50; i < count; i++) {
    offsets[i] = offset;
    offset += len;
    len = Math.max(minMipSize, len >> 2);
  }

  return offsets;
}

function toTexOffsetArray(ddsInfo: ParsedDds) {
  const mipMapLength = getTexMipMapLengthFormat(ddsInfo);
  const offsetArray = getMipMapOffsets(mipMapLength, ddsInfo);

  return offsetArray;
}

export async function ddsToTex(file: File) {
  const ddsInfo = parseDds(await file.arrayBuffer());
  const { header, headerDxt10, body } = ddsInfo;

  // Check if it's a 2D texture
  if (
    header.caps2.flags.includes(Caps2Flags.DDSCAPS2_CUBEMAP) ||
    header.caps2.flags.includes(Caps2Flags.DDSCAPS2_VOLUME)
  ) {
    throw new NotYetImplementedError('Only 2D texture conversion implemented');
  }

  // Start building
  const texHeader = {
    // Attributes / flags. 2D Texture for now
    attributes: TextureType.TEXTURE_TYPE_2D,

    // Pixel format
    format: toTexPixelFormat(ddsInfo),

    // Image dimensions
    width: header.width,
    height: header.height,

    // Depth
    depth: header.depth,

    // MipMap levels
    mipLevels: Math.min(header.mipMapCount, 13),

    // Image array size. 0 if 2D texture
    arraySize: 0,

    // LoD indices/offsets
    lodIndices: [0, 1, 2],

    // Offsets to each mipmap
    offsetsToSurfaces: toTexOffsetArray(ddsInfo),
  };

  // Build the file data
  const fileBuffers = [
    new Uint32Array([texHeader.attributes]),
    new Uint32Array([texHeader.format]),
    new Uint16Array([texHeader.width, texHeader.height]),
    new Uint16Array([texHeader.depth]),
    new Uint8Array([texHeader.mipLevels]),
    new Uint8Array([texHeader.arraySize]),
    new Uint32Array(texHeader.lodIndices),
    new Uint32Array(texHeader.offsetsToSurfaces),
    body._raw,
  ];

  return {
    header: texHeader,
    data: fileBuffers,
  };
}
