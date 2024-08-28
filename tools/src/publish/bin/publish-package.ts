/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */
import { execSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { DEFAULT_REGISTRY } from 'verdaccio/build/lib/constants';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { objectToCliArgs } from '../../../../packages/utils/src';
import { parseVersion } from '../../utils';
import type { PublishOptions } from '../types';
import { nxBumpVersion } from '../utils';

const argv = yargs(hideBin(process.argv))
  .options({
    directory: { type: 'string' },
    projectName: { type: 'string' },
    nextVersion: { type: 'string' },
    tag: { type: 'string', default: 'next' },
    registry: { type: 'string' },
    userconfig: { type: 'string' },
    verbose: { type: 'boolean' },
  })
  .coerce('nextVersion', parseVersion).argv;
const {
  directory = process.cwd(),
  projectName,
  nextVersion,
  tag,
  registry = DEFAULT_REGISTRY,
  userconfig,
} = argv as PublishOptions;

if (nextVersion) {
  // Updating the version in "package.json" before publishing
  nxBumpVersion({ nextVersion, directory, projectName });
}

try {
  execSync(
    objectToCliArgs({
      _: ['npm', 'publish'],
      access: 'public',
      ...(tag ? { tag } : {}),
      ...(registry ? { registry } : {}),
      ...(userconfig
        ? {
            userconfig: relative(
              join(process.cwd(), directory ?? ''),
              join(process.cwd(), userconfig),
            ),
          }
        : {}),
    }).join(' '),
    {
      cwd: directory,
    },
  );
} catch (error) {
  if (
    (error as Error).message.includes(
      `need auth This command requires you to be logged in to ${registry}`,
    )
  ) {
    console.info(
      `Authentication error! Check if your registry is set up correctly. If you publish to a public registry run login before.`,
    );
    process.exit(1);
  } else if (
    (error as Error).message.includes(`Cannot publish over existing version`)
  ) {
    console.info(`Version ${nextVersion} already published to ${registry}.`);
    process.exit(0);
  }
  throw error;
}
process.exit(0);
