import { globby as g } from 'globby';

export function globby(pattern: string[]): Promise<string[]> {
  return g(pattern);
}
