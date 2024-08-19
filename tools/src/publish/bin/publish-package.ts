/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_REGISTRY } from 'verdaccio/build/lib/constants';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { objectToCliArgs } from '../../../../packages/utils/src';
import { parseVersion } from '../../utils';
import type { PublishOptions } from '../types';
import { findLatestVersion, nxBumpVersion } from '../utils';

const argv = yargs(hideBin(process.argv))
  .options({
    directory: { type: 'string' },
    projectName: { type: 'string' },
    nextVersion: { type: 'string' },
    tag: { type: 'string', default: 'next' },
    registry: { type: 'string' },
    verbose: { type: 'boolean' },
  })
  .coerce('nextVersion', parseVersion).argv;
const {
  directory = process.cwd(),
  projectName,
  nextVersion,
  tag,
  registry = DEFAULT_REGISTRY,
  verbose,
} = argv as PublishOptions;
const version = nextVersion ?? findLatestVersion();

// Updating the version in "package.json" before publishing
nxBumpVersion({ nextVersion: version, directory, projectName });

const packageJson = JSON.parse(
  readFileSync(join(directory, 'package.json')).toString(),
);
const pkgRange = `${packageJson.name}@${version}`;

// @TODO if we hav no registry set up this implementation swallows the error
/*if (npmCheck(
  { registry, pkgRange },
) === 'FOUND') {
  console.warn(`Package ${version} is already published.`);
  process.exit(0);
}*/

try {
  execSync(
    objectToCliArgs({
      _: ['npm', 'publish'],
      access: 'public',
      ...(tag ? { tag } : {}),
      ...(registry ? { registry } : {}),
    }).join(' '),
    {
      cwd: directory,
    },
  );
} catch (error) {
  if (
    error.message.includes(
      `need auth This command requires you to be logged in to ${registry}`,
    )
  ) {
    console.info(
      `Authentication error! Check if your registry is set up correctly. If you publish to a public registry run login before.`,
    );
    process.exit(1);
  } else if (error.message.includes(`Cannot publish over existing version`)) {
    console.info(`Version ${version} already published to ${registry}.`);
    process.exit(0);
  }
  throw error;
}
process.exit(0);
