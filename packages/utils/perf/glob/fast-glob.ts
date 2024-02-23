import * as fg from 'fast-glob';

export function fastGlob(pattern: string[]): Promise<string[]> {
  return fg.async(pattern);
}
