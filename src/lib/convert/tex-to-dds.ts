import {
  parseTex,
  type TexHeader,
} from '$lib/parsers/tex-parser';
import { TextureFormat, TextureType } from '$lib/enums/tex';
import { CapsFlags, DdsFormatFlags, DdsPixelFormats, DxgiFormats, FormatFlags } from '$lib/enums/dds';

function toDdsFlags(header: TexHeader) {
  let flags = FormatFlags.DDSD_CAPS +
    FormatFlags.DDSD_HEIGHT +
    FormatFlags.DDSD_WIDTH +
    FormatFlags.DDSD_PIXELFORMAT;

  if (
    header.format.value === TextureFormat.A8 ||
    header.format.value === TextureFormat.L8 ||
    header.format.value === TextureFormat.B8G8R8A8
  ) {
    flags += FormatFlags.DDSD_PITCH;
  } else {
    flags += FormatFlags.DDSD_LINEARSIZE;
  }

  if (header.mipMapCount > 1) {
    flags += FormatFlags.DDSD_MIPMAPCOUNT;
  }

  return flags;
}

function toDdsPitchOrLinearSize(header: TexHeader) {
  const { height, width, format } = header;

  let bpp = 0;;
  let pitch = 0;

  if (
    format.value === TextureFormat.B8G8R8A8 ||
    format.value === TextureFormat.B8G8R8X8
  ) {
    bpp = 32;
    pitch = (width * bpp + 7) / 8;
  } else if (format.value === TextureFormat.B4G4R4A4) {
    bpp = 16;
    pitch = (width * bpp + 3) / 8;
  } else if (
    format.value === TextureFormat.A8 ||
    format.value === TextureFormat.L8
  ) {
    bpp = 8;
    pitch = (width * bpp + 7) / 8;
  } else {
    let blockSize = 0;

    if (format.value === TextureFormat.DXT1) {
      blockSize = 8;
    } else if (
      format.value === TextureFormat.BC7 ||
      format.value === TextureFormat.DXT5 ||
      format.value === TextureFormat.DXT3 ||
      format.value === TextureFormat.ATI2 ||
      format.value === TextureFormat.ATI1
    ) {
      blockSize = 16;
    } else {
      throw new Error(`Unhandled format ${format.text}`);
    }

    pitch = Math.max(1, (width / 4)) * Math.max(1, (height / 4)) * blockSize;
  }

  return Math.floor(pitch);
}

function toFourCC(header: TexHeader) {
  const { format } = header;

  switch (format.value) {
    case TextureFormat.DXT1:
      return DdsPixelFormats.DXT1;

    case TextureFormat.DXT3:
      return DdsPixelFormats.DXT3;

    case TextureFormat.DXT5:
      return DdsPixelFormats.DXT5;

    case TextureFormat.ATI1:
    case TextureFormat.ATI2:
    case TextureFormat.BC7:
      return DdsPixelFormats.DX10;

    case TextureFormat.B8G8R8A8:
    case TextureFormat.A8:
    case TextureFormat.L8:
    case TextureFormat.B4G4R4A4:
      return DdsPixelFormats.NONE;

    default:
      throw new Error(`Unhandled format ${format.text}`);
  }
}

function toDdsPixelFormat(header: TexHeader) {
  const fourCC = toFourCC(header);

  const { format } = header;

  let flags = 0;
  let rgbBitCount = 0;
  let rBitMask = 0;
  let gBitMask = 0;
  let bBitMask = 0;
  let aBitMask = 0;

  switch (format.value) {
    case TextureFormat.B8G8R8A8:
      flags = DdsFormatFlags.DDPF_ALPHAPIXELS + DdsFormatFlags.DDPF_RGB;
      rgbBitCount = 32;
      rBitMask = 0x00ff0000;
      gBitMask = 0x0000ff00;
      bBitMask = 0x000000ff;
      aBitMask = 0xff000000;
      break;
    case TextureFormat.A8:
      flags = DdsFormatFlags.DDPF_ALPHA;
      rgbBitCount = 32;
      aBitMask = 0x000000ff;
      break;
    case TextureFormat.L8:
      flags = DdsFormatFlags.DDPF_LUMINANCE;
      rgbBitCount = 32;
      rBitMask = 0x000000ff;
      break;
    case TextureFormat.B4G4R4A4:
      flags = DdsFormatFlags.DDPF_ALPHAPIXELS + DdsFormatFlags.DDPF_RGB;
      rgbBitCount = 16;
      break;
    default:
      flags = DdsFormatFlags.DDPF_FOURCC;
  }

  return {
    size: 32,
    flags,
    fourCC,
    rgbBitCount,
    rBitMask,
    gBitMask,
    bBitMask,
    aBitMask,
  };
}

function toCaps1(header: TexHeader) {
  let caps = CapsFlags.DDSCAPS_TEXTURE;

  if (header.mipMapCount > 1) {
    caps += CapsFlags.DDSCAPS_COMPLEX + CapsFlags.DDSCAPS_MIPMAP;
  }

  return caps;
}

function toCaps2(header: TexHeader) {
  // For cube maps or volumes. NYI
  return 0;
}

function toDxgiFormat(header: TexHeader) {
  const { format } = header;

  switch (format.value) {
    case TextureFormat.BC7:
      return DxgiFormats.DXGI_FORMAT_BC7_UNORM;
    case TextureFormat.ATI2:
      return DxgiFormats.DXGI_FORMAT_BC5_UNORM;
    case TextureFormat.ATI1:
      return DxgiFormats.DXGI_FORMAT_BC4_UNORM;
    default:
      throw new Error(`[DX10 Header] Unhandled format ${format.text}`);
  }
}

function toDdsDx10Header(header: TexHeader) {
  return {
    dxgiFormat: toDxgiFormat(header),
    d3d10ResourceDimension: 3, // 2D texture only
    miscFlag: 0, // not a cube map
    arraySize: 1, // only one texture
    miscFlags2: 0, // unknown alpha
  };
}

export async function texToDds(file: File) {
  const texInfo = parseTex(await file.arrayBuffer());
  const { header, body } = texInfo;

  // Check if it's a 2D texture
  if (
    !(header.flags.value & TextureType.TEXTURE_TYPE_2D)
  ) {
    throw new Error('Only 2D texture conversion implemented');
  }

  // Start building
  // https://learn.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide
  const magic = 'DDS ';
  const ddsHeader = {
    size: 124,
    flags: toDdsFlags(header),
    height: header.height,
    width: header.width,
    pitchOrLinearSize: toDdsPitchOrLinearSize(header),
    depth: header.depth,
    mipMapCount: header.mipMapCount,
    reserved1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // unused
    ddsPixelFormat: toDdsPixelFormat(header),
    caps: toCaps1(header),
    caps2: toCaps2(header),
    caps3: 0, // unused
    caps4: 0, // unused
    reserved2: 0, // unused
  };

  const hasFourCC = toFourCC(header) === DdsPixelFormats.DX10;

  const ddsHeaderDx10 = hasFourCC ? toDdsDx10Header(header) : null;

  return {
    magic,
    header: ddsHeader,
    headerDxt10: ddsHeaderDx10,
  };
}
