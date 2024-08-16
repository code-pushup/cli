/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */
import devkit from '@nx/devkit';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { readCachedProjectGraph, logger } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;

// Executing publish script: node path/to/publish.mjs {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
const {
  name: projectName,
  nextVersion: version,
  tag,
  registry,
} = yargs(hideBin(process.argv))
  .options({
    name: { type: 'string', demandOption: true },
    nextVersion: {
      type: 'string',
      alias: ['ver', 'v'],
    },
    tag: { type: 'string', default: 'next' },
    registry: { type: 'string' },
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

const graph = readCachedProjectGraph();
const project = graph.nodes[projectName];

invariant(
  project,
  `Could not find project "${projectName}" in the workspace. Is the project.json configured correctly?`,
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${projectName}". Is project.json configured  correctly?`,
);

const cwd = process.cwd();
process.chdir(outputPath);

// Updating the version in "package.json" before publishing
let packageJson;

try {
  packageJson = JSON.parse(readFileSync(`package.json`).toString());
  if (version != null) {
    console.info(
      `Updating package.json version from ${packageJson.version} to ${version}`,
    );
    packageJson.version = version;
    writeFileSync(`package.json`, JSON.stringify(packageJson, null, 2));
  }
} catch (e) {
  console.info(`Error reading package.json file from ${outputPath}.`);
  process.exit(1);
}

const packageRange = `${packageJson.name}@${packageJson.version}`;
try {
  execSync(
    `node tools/scripts/check-package-range.mjs --pkgVersion=${packageRange} ${
      registry ? `--registry=${registry}` : ''
    }`,
    { cwd },
  );
  console.warn(`Package ${packageRange} is already published.`);
  process.exit(0);
} catch (error) {
  console.info(
    `Package ${packageRange} is not published yet. Proceeding to publish.`,
  );
}

execSync(
  `npm publish --access public ${tag ? '--tag=' + tag : ''} ${
    registry ? '--registry=' + registry : ''
  }`,
);
process.exit(0);
