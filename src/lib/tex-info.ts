import { parseTex } from './parsers/tex-parser';

export async function getTexInfo(file: File) {
  const buffer = await file.arrayBuffer();
  const parsed = parseTex(buffer);

  return parsed;
}
