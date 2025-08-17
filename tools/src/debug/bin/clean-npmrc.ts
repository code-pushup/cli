import yargs, { type Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { cleanNpmrc } from '../utils.js';
import type { CleanNpmrcBinOptions } from './types.js';

const argv = yargs(hideBin(process.argv))
  .version(false)
  .options({
    userconfig: { type: 'string' },
    entryMatch: { type: 'array' },
    verbose: { type: 'boolean' },
    force: { type: 'boolean' },
  } satisfies Record<keyof CleanNpmrcBinOptions, Options>)
  .coerce('entriesToRemove', entriesToRemove =>
    Array.isArray(entriesToRemove) ? entriesToRemove : [entriesToRemove],
  ).argv;

const { userconfig, entryMatch = [] } = argv as CleanNpmrcBinOptions;

if (entryMatch.length === 0) {
  throw new Error(
    'This would remove all entries. Please provide a entry filter --entryMatch. (or pass --force if you really want to remove ALL entries)',
  );
}

cleanNpmrc({
  ...(userconfig ? { userconfig } : {}),
  entryMatch,
});
