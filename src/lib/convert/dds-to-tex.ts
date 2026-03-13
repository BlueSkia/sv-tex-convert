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
        throw new Error(`Unhandled format ${dxgiFormat.text}`);
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

  throw new Error(`Unhandled format ${fourCC.value}`);
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

  if (fourCC.value === DdsPixelFormats.DXT1) {
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

function getMipMapOffsets(mipMapLength: number, ddsInfo: ParsedDds) {
  const count = ddsInfo.header.mipMapCount;

  const isBC1 = ddsInfo.header.ddsPixelFormat.fourCC.value === DdsPixelFormats.DXT1;

  const offsets: number[] = [];
  let max = 13;

  for (let i = 0, len = mipMapLength, offset = 0x50; i < max; i++) {
    if (offsets.length < count) {
      offsets.push(offset);
    } else {
      offsets.push(0);
    }
    offset += len;
    len = Math.max(isBC1 ? 8 : 16, len >> 2);
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
    throw new Error('Only 2D texture conversion implemented');
  }

  // Start building
  const texHeader = {
    attributes: TextureType.TEXTURE_TYPE_2D,
    format: toTexPixelFormat(ddsInfo),
    width: header.width,
    height: header.height,
    depth: header.depth,
    mipLevels: Math.min(header.mipMapCount, 13),
    arraySize: 0, // 0 if 2D texture
    lodIndices: [0, 1, 2],
    offsetsToSurfaces: toTexOffsetArray(ddsInfo),
  };

  const headerBuffer = new ArrayBuffer(
    4 + // attributes
    4 + // format
    2 + // width
    2 + // height
    2 + // depth
    1 + // mipLevels
    1 + // arraySize
    (4 * 3) + // lod indices
    (4 * 13) // offsets to surfaces
  );
  const headerBufferView = new DataView(headerBuffer);
  headerBufferView.setUint32(0, texHeader.attributes, true);
  headerBufferView.setUint32(4, texHeader.format, true);
  headerBufferView.setUint16(8, texHeader.width, true);
  headerBufferView.setUint16(10, texHeader.height, true);
  headerBufferView.setUint16(12, texHeader.depth, true);
  headerBufferView.setUint16(14, texHeader.mipLevels, true);
  headerBufferView.setUint16(15, texHeader.arraySize, true);
  texHeader.lodIndices.forEach((v, i) => {
    headerBufferView.setUint32(16 + (i * 4), v, true);
  });
  texHeader.offsetsToSurfaces.forEach((v, i) => {
    headerBufferView.setUint32(28 + (i * 4), v, true);
  });

  const bodyBuffer = body._raw.buffer;

  const headerBufferArray = new Uint8Array(headerBuffer);
  const bodyBufferArray = body._raw;

  const fileBuffer = new ArrayBuffer(headerBuffer.byteLength + bodyBuffer.byteLength);
  const fileBufferView = new DataView(fileBuffer);
  headerBufferArray.forEach((v, i) => {
    fileBufferView.setUint8(i, v);
  });
  bodyBufferArray.forEach((v, i) => {
    fileBufferView.setUint8(headerBuffer.byteLength + i, v);
  });

  return {
    header: texHeader,
    buffer: fileBuffer,
  };
}
