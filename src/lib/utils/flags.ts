export function parseFlags(n: number, flagEnum: Record<string | number, string | number>) {
  const numberKeys = Object.keys(flagEnum).map(Number).filter(v => v);

  return numberKeys
    .filter(v => v & n)
    .map(v => flagEnum[v as keyof typeof flagEnum]);
}
