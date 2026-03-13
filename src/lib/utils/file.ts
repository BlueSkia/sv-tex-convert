export function filenameComponents(file: File) {
  const { name } = file;

  const components = name.match(/(.+)(\.\w+)$/);

  return {
    basename: components && components[1],
    extension: components && components[2],
  };
}
