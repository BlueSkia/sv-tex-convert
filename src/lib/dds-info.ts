import { parseDds } from './parsers/dds-parser';

export async function getDdsInfo(file: File) {
  const buffer = await file.arrayBuffer();
  const parsed = parseDds(buffer);
  return parsed;
}
