import { getMagic } from './parsers/magic';

export async function isDds(file: File) {
  const contents = await (file.slice(0, 4)).arrayBuffer();
  return getMagic(contents, true) === 'DDS ';
}

// This is very brittle at the moment. Based solely off of file extension
export async function isTex(file: File) {
  const { name } = file;
  const ext = name.match(/\.\w+$/);

  return Promise.resolve(Array.isArray(ext) && ext[0].toLocaleLowerCase() === '.tex');
}
