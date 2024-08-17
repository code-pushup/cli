/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */
import { logger, readCachedProjectGraph } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { NpmCheckToken } from '../../npm/types';

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
const {
  name: projectName,
  nextVersion: version,
  tag,
  registry,
  verbose,
  sourceDir,
} = yargs(hideBin(process.argv))
  .options({
    name: { type: 'string', demandOption: true },
    sourceDir: { type: 'string' },
    nextVersion: {
      type: 'string',
      alias: ['ver', 'v'],
    },
    tag: { type: 'string', default: 'next' },
    registry: { type: 'string' },
    verbose: { type: 'boolean' },
  })
  .coerce('nextVersion', rawVersion => {
    if (rawVersion != null && rawVersion !== '') {
      invariant(
        rawVersion && validVersion.test(rawVersion),
        `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${rawVersion}.`,
      );
      return rawVersion;
    } else {
      return undefined;
    }
  }).argv;

const cwd = process.cwd();
process.chdir(sourceDir);

// Updating the version in "package.json" before publishing
let packageJson;

try {
  packageJson = JSON.parse(readFileSync(`package.json`).toString());
  if (version != null) {
    if (verbose) {
      console.info(
        `Updating package.json version from ${packageJson.version} to ${version}`,
      );
    }
    packageJson.version = version;
    writeFileSync(`package.json`, JSON.stringify(packageJson, null, 2));
  }
} catch (e) {
  console.info(`Error reading package.json file from ${sourceDir}.`);
  process.exit(1);
}

const pkgRange = `${packageJson.name}@${packageJson.version}`;
// @TODO replace with nxNpmCheck
const [_, token] = execSync(
  `tsx tools/src/npm/scripts/check-package-range.ts --pkgRange=${pkgRange} ${
    registry ? `--registry=${registry}` : ''
  }`,
  { cwd },
)
  .toString()
  .trim()
  .split('#') as [string, NpmCheckToken];

if (token === 'FOUND') {
  console.warn(`Package ${pkgRange} is already published.`);
  process.exit(0);
}

execSync(
  `npm publish --access public ${tag ? '--tag=' + tag : ''} ${
    registry ? '--registry=' + registry : ''
  }`,
);
process.exit(0);
