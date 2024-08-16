import { execFileSync } from 'node:child_process';
import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { objectToCliArgs } from '../../../../packages/utils/src';
import { NpmCheckOptions, NpmCheckResult } from '../types';

const argv = yargs(hideBin(process.argv))
  .options({
    pkgRange: { type: 'string', demandOption: true },
    registry: { type: 'string' },
  })
  .coerce('pkgRange', rawVersion => {
    if (rawVersion != null && rawVersion !== '') {
      return rawVersion;
    } else {
      return undefined;
    }
  })
  .coerce('registry', rawRegistry => {
    if (rawRegistry != null && rawRegistry !== '') {
      return rawRegistry;
    } else {
      return undefined;
    }
  }).argv;

const { pkgRange, registry = 'https://registry.npmjs.org/' } =
  argv as NpmCheckOptions;

try {
  const viewResult = execFileSync(
    'npm',
    [
      ...objectToCliArgs({
        _: ['view', pkgRange],
        registry,
      }),
      // Hide process output via "2>/dev/null". Otherwise, it will print the error message to the terminal.
      '2>/dev/null',
    ],
    { shell: true },
  ).toString();

  const existingPackage = viewResult
    .split('\n')
    .filter(Boolean)
    .at(0)
    .split(' ')
    .at(0);
  console.log(`${pkgRange}#FOUND` satisfies NpmCheckResult); // process output to parse
  process.exit(0);
} catch (e) {
  console.log(`${pkgRange}#NOT_FOUND` satisfies NpmCheckResult); // process output to parse
  process.exit(0);
}
