export const filterOutWarnings = (output: string): string =>
  output
    .split('\n')
    .filter(line => !line.includes('WARN'))
    .join('\n');
