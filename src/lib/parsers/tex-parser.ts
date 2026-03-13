import { sliceByLength } from '$lib/utils/buffer';
import { parseFlags } from '$lib/utils/flags';
import { TextureFormat, TextureType } from '$lib/enums/tex';

export type ParsedTex = ReturnType<typeof parseTex>;
export type TexHeader = ReturnType<typeof parseTexHeader>;

const headerSize = 0x50;

export function parseTex(buffer: ArrayBuffer) {
  const header = parseTexHeader(buffer.slice(0, headerSize));
  const body = parseTexBody(buffer, header.offsetsToSurfaces, buffer.byteLength);

  return {
    header,
    body,
  };
}

function parseTexHeader(buffer: ArrayBuffer) {
  const flags = new Uint32Array(sliceByLength(buffer, 0, 4));
  const format = new Uint32Array(sliceByLength(buffer, 4, 4));
  const width = new Uint16Array(sliceByLength(buffer, 8, 2));
  const height = new Uint16Array(sliceByLength(buffer, 10, 2));
  const depth = new Uint16Array(sliceByLength(buffer, 12, 2));
  const mipLevels = new Uint8Array(sliceByLength(buffer, 14, 1));
  const arraySize = new Uint8Array(sliceByLength(buffer, 15, 1));
  const lodIndices = new Uint32Array(sliceByLength(buffer, 16, 4 * 3));
  const offsetsToSurfaces = new Uint32Array(sliceByLength(buffer, 28, 4 * 13));

  const mipMapCount = Number(mipLevels) & 0x7f;
  const mipMapUnknown = Number(mipLevels) & 0x80;

  return {
    _raw: {
      flags,
      format,
      width,
      height,
      depth,
      mipLevels,
      arraySize,
      lodIndices,
      offsetsToSurfaces,
    },
    flags: {
      flags: parseFlags(Number(flags), TextureType),
      value: Number(flags),
    },
    format: {
      text: TextureFormat[(Number(format) as keyof typeof TextureFormat)],
      value: Number(format),
    },
    width: Number(width),
    height: Number(height),
    depth: Number(depth),
    mipMapCount,
    mipMapUnknown,
    arraySize: Number(arraySize),
    lodIndices: Array.from(lodIndices),
    offsetsToSurfaces: Array.from(offsetsToSurfaces),
  };
}

function parseTexBody(buffer: ArrayBuffer, offsets: number[], eof: number) {
  const filtered = offsets
    .filter(v => v !== 0);

  const normalizedOffsets: { start: number, end: number, length: number }[] = [];

  filtered.forEach((v, i) => {
    const nextStart = filtered[i + 1] || eof;
    normalizedOffsets[i] = {
      start: v,
      end: nextStart,
      length: nextStart - v,
    };
  });

  const mipMaps = normalizedOffsets.map(v => {
    return {
      start: v.start,
      end: v.end,
      length: v.length,
      data: new Uint8Array(buffer.slice(v.start, v.end)),
    }
  });

  return {
    _raw: new Uint8Array(buffer),
    mainTexture: mipMaps[0],
    mipMaps: mipMaps.slice(1),
  };
}
