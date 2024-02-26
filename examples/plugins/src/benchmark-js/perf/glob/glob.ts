import { glob as g } from 'glob';

export function glob(pattern: string[]): Promise<string[]> {
  return g(pattern);
}
