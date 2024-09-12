export const filterOutWarnings = (output: string): string =>
  output
    .split('\n')
    .filter(line => !line.trim().startsWith('WARN'))
    .join('\n');
