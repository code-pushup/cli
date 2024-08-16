import { Options } from 'yargs';
import type { MergeDiffsOptions } from './merge-diffs.model';

export function yargsMergeDiffsOptionsDefinition(): Record<
  keyof MergeDiffsOptions,
  Options
> {
  return {
    files: {
      describe: 'List of report-diff.json paths',
      type: 'array',
      demandOption: true,
    },
  };
}
