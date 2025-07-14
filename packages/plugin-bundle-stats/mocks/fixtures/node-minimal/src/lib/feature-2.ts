import { minimatch } from 'minimatch';

export function chart(): string {
  return minimatch('src/lib/feature-2.ts', '**/*.ts') ? 'Match' : 'No Match';
}
