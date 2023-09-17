import { CategoryConfig } from '@quality-metrics/models';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

export const reportHeadlineText = 'Code Pushup Report';
export const reportOverviewTableHeaders = ['Category', 'Score', 'Audits'];

// @TODO replace with real scoring logic
export function sumRefs(refs: CategoryConfig['refs']) {
  return refs.reduce((sum, { weight }) => sum + weight, refs.length);
}

export function countWeightedRefs(refs: CategoryConfig['refs']) {
  return refs
    .filter(({ weight }) => weight > 0)
    .reduce((sum, { weight }) => sum + weight, refs.length);
}

export class ReadPackageJsonError extends Error {
  constructor(message: string) {
    super(`error reading package.json: ${message}`);
  }
}

export async function readPackageJson() {
  try {
    const __dirname = fileURLToPath(dirname(import.meta.url));
    const filepath = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'cli',
      'package.json',
    );
    return JSON.parse(readFileSync(filepath).toString()) as {
      name: string;
      version: string;
    };
  } catch (e) {
    const _e = e as { message: string };
    console.warn(_e.message);
    throw new ReadPackageJsonError(_e.message);
  }
}
