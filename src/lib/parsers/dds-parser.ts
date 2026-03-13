import { sliceByLength } from '$lib/utils/buffer';
import { parseFlags } from '$lib/utils/flags';
import {
  Caps2Flags,
  CapsFlags,
  D3d10ResourceDimensionFormats,
  D3d11ResourceMiscFlags,
  D3d11ResourceMiscFlags2,
  DdsFormatFlags,
  DdsPixelFormats,
  DxgiFormats,
  FormatFlags,
} from '$lib/enums/dds';

export type ParsedDds = ReturnType<typeof parseDds>;
export type DdsHeader = ReturnType<typeof parseDdsHeader>;

function hasDx10(header: DdsHeader) {
  return header.ddsPixelFormat.flags.flags.includes('DDPF_FOURCC') &&
    header.ddsPixelFormat.fourCC.text === 'DX10';
}

export function parseDds(buffer: ArrayBuffer) {
  const magic = new Uint32Array(buffer.slice(0, 4));
  const header = parseDdsHeader(buffer);

  const isBlockCompressed = ['DXT1', 'DXT2', 'DXT3', 'DXT4', 'DXT5', 'DX10'].includes(header.ddsPixelFormat.fourCC.text);

  let headerDxt10 = undefined;

  if (hasDx10(header)) {
    headerDxt10 = parseDdsHeaderDx10(buffer.slice(header.size + magic.byteLength));
  }

  const body = parseDdsBody(buffer.slice(4 + header.size + (headerDxt10 ? 4 * 5 : 0)));

  return {
    magic: Number(magic),
    header,
    headerDxt10,
    body,
    isBlockCompressed,
  };
}

function parseDdsPixelFormat(buffer: ArrayBuffer) {
  const size = new Uint32Array(sliceByLength(buffer, 0, 4));
  const flags = new Uint32Array(sliceByLength(buffer, 4, 4));
  const fourCC = new Uint32Array(sliceByLength(buffer, 8, 4));
  const rgbBitCount = new Uint32Array(sliceByLength(buffer, 12, 4));
  const rBitMask = new Uint32Array(sliceByLength(buffer, 16, 4));
  const gBitMask = new Uint32Array(sliceByLength(buffer, 20, 4));
  const bBitMask = new Uint32Array(sliceByLength(buffer, 24, 4));
  const aBitMask = new Uint32Array(sliceByLength(buffer, 28, 4));

  return {
    _raw: {
      size,
      flags,
      fourCC,
      rgbBitCount,
      rBitMask,
      gBitMask,
      bBitMask,
      aBitMask,
    },

    size: Number(size),
    flags: {
      flags: parseFlags(Number(flags), DdsFormatFlags),
      value: Number(flags),
    },
    fourCC: {
      text: DdsPixelFormats[Number(fourCC) as keyof typeof DdsPixelFormats] as string,
      value: Number(fourCC),
    },
    rgbBitCount: Number(rgbBitCount),
    rBitMask: Number(rBitMask),
    gBitMask: Number(gBitMask),
    bBitMask: Number(bBitMask),
    aBitMask: Number(aBitMask),
  };
}

function parseDdsHeader(buffer: ArrayBuffer) {
  const size = new Uint32Array(sliceByLength(buffer, 4, 4));
  const flags = new Uint32Array(sliceByLength(buffer, 8, 4));
  const height = new Uint32Array(sliceByLength(buffer, 12, 4));
  const width = new Uint32Array(sliceByLength(buffer, 16, 4));
  const pitchOrLinearSize = new Uint32Array(sliceByLength(buffer, 20, 4));
  const depth = new Uint32Array(sliceByLength(buffer, 24, 4));
  const mipMapCount = new Uint32Array(sliceByLength(buffer, 28, 4));
  const reserved1 = new Uint32Array(sliceByLength(buffer, 32, 44));
  const ddsPixelFormat = parseDdsPixelFormat(sliceByLength(buffer, 76, 32));
  const caps = new Uint32Array(sliceByLength(buffer, 108, 4));
  const caps2 = new Uint32Array(sliceByLength(buffer, 112, 4));
  const caps3 = new Uint32Array(sliceByLength(buffer, 116, 4));
  const caps4 = new Uint32Array(sliceByLength(buffer, 120, 4));
  const reserved2 = new Uint32Array(sliceByLength(buffer, 124, 4));

  return {
    _raw: {
      size,
      flags,
      height,
      width,
      pitchOrLinearSize,
      depth,
      mipMapCount,
      reserved1,
      ddsPixelFormat: ddsPixelFormat._raw,
      caps,
      caps2,
      caps3,
      caps4,
      reserved2,
    },

    size: Number(size),
    flags: {
      flags: parseFlags(Number(flags), FormatFlags),
      value: Number(flags),
    },
    height: Number(height),
    width: Number(width),
    pitchOrLinearSize: Number(pitchOrLinearSize),
    depth: Number(depth),
    mipMapCount: Number(mipMapCount),
    ddsPixelFormat,
    caps: {
      flags: parseFlags(Number(caps), CapsFlags),
      value: Number(caps),
    },
    caps2: {
      flags: parseFlags(Number(caps2), Caps2Flags),
      value: Number(caps2),
    },
  };
}

function parseDdsHeaderDx10(buffer: ArrayBuffer) {
  const dxgiFormat = new Uint32Array(sliceByLength(buffer, 0, 4));
  const d3d10ResourceDimension = new Uint32Array(sliceByLength(buffer, 4, 4));
  const miscFlag = new Uint32Array(sliceByLength(buffer, 8, 4));
  const arraySize = new Uint32Array(sliceByLength(buffer, 12, 4));
  const miscFlags2 = new Uint32Array(sliceByLength(buffer, 16, 4));

  return {
    _raw: {
      dxgiFormat,
      d3d10ResourceDimension,
      miscFlag,
      arraySize,
      miscFlags2,
    },

    dxgiFormat: {
      text: DxgiFormats[Number(dxgiFormat) as keyof typeof DxgiFormats],
      value: Number(dxgiFormat),
    },
    d3d10ResourceDimension: {
      text: D3d10ResourceDimensionFormats[Number(d3d10ResourceDimension) as keyof typeof D3d10ResourceDimensionFormats],
      value: Number(d3d10ResourceDimension),
    },
    miscFlag: {
      flags: parseFlags(Number(miscFlag), D3d11ResourceMiscFlags),
      value: Number(miscFlag),
    },
    arraySize: Number(arraySize),
    miscFlags2: {
      flags: parseFlags(Number(miscFlags2), D3d11ResourceMiscFlags2),
      value: Number(miscFlags2),
    },
  };
}

function parseDdsBody(buffer: ArrayBuffer) {
  return {
    _raw: new Uint8Array(buffer),
  };
}
