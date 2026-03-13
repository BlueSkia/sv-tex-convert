export function getMagic(fileContents: ArrayBuffer, asText = false) {
  const bytes = new Uint8Array(fileContents.slice(0, 4));

  if (asText) {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  return Array.from(bytes);
}
