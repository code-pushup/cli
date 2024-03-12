import { Options } from 'yargs';
import type { CompareOptions } from './compare.model';

export function yargsCompareOptionsDefinition(): Record<
  keyof CompareOptions,
  Options
> {
  return {
    before: {
      describe: 'Path to source report.json',
      type: 'string',
      demandOption: true,
    },
    after: {
      describe: 'Path to target report.json',
      type: 'string',
      demandOption: true,
    },
  };
}
