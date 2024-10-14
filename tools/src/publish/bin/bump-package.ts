import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseVersion } from '../../utils';
import type { BumpOptions } from '../types';

const argv = yargs(hideBin(process.argv))
  .options({
    nextVersion: {
      type: 'string',
    },
    verbose: { type: 'boolean' },
  })
  .coerce('nextVersion', parseVersion).argv;

const {
  nextVersion: version,
  verbose,
  directory = process.cwd(),
} = argv as BumpOptions;
// Updating the version in "package.json"
const packageJsonFile = join(directory, 'package.json');
try {
  const packageJson = JSON.parse(readFileSync(packageJsonFile).toString());
  if (version != null) {
    if (packageJson.version === version) {
      console.info(`Package version is already set to ${version}.`);
      // process.exit(0);
    }

    console.info(
      `Updating ${packageJsonFile} version from ${packageJson.version} to ${version}`,
    );
    writeFileSync(
      packageJsonFile,
      JSON.stringify(
        { ...packageJson, version, description: 'E2E test' },
        null,
        2,
      ),
    );
    process.exit(0);
  }
  // @TODO: Implement autodetect version bump
  console.info(
    'Autodetecting version bump not yet implemented, exiting with error',
  );
  process.exit(1);
} catch (e) {
  console.info(`Error updating version in ${packageJsonFile} file.`);
  process.exit(1);
}
