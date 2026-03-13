/**
 * Simpler way to get a slice of a buffer by specifying the length instead of the end offset
 * @param buffer Buffer
 * @param offset Start byte
 * @param length How many bytes
 * @returns The new buffer slice
 */
export function sliceByLength(
  buffer: ArrayBuffer,
  offset: number,
  length: number,
) {
  const start = offset;
  const end = start + length;

  if (
    !(Number.isInteger(offset) && Number.isFinite(offset) && offset >= 0)
  ) {
    throw new Error('Offset must be 0 or a positive finite integer');
  }

  if (
    !(Number.isInteger(length) && Number.isFinite(length) && length >= 1)
  ) {
    throw new Error('Length must be a positive finite integer');
  }

  if (end > buffer.byteLength) {
    throw new Error("Can't read more data than the buffer holds");
  }

  return buffer.slice(offset, offset + length);
}
