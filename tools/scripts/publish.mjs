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
  name,
  ver: version,
  tag,
  registry,
} = yargs(hideBin(process.argv))
  .options({
    name: { type: 'string', demandOption: true },
    ver: { type: 'string', demandOption: true },
    tag: { type: 'string', default: 'next' },
    registry: { type: 'string' },
  })
  .coerce('ver', ver => {
    invariant(
      ver && validVersion.test(ver),
      `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${ver}.`,
    );
    return ver;
  }).argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`,
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`,
);

process.chdir(outputPath);

// Updating the version in "package.json" before publishing
let packageJson;
try {
  packageJson = JSON.parse(readFileSync(`package.json`).toString());
  packageJson.version = version;
  writeFileSync(`package.json`, JSON.stringify(packageJson, null, 2));
} catch (e) {
  throw new Error(`Error reading package.json file from library build output.`);
}

const pkgTagged = `${packageJson.name}@${tag}`;
try {
  // Hide process output via "2>/dev/null". Otherwise, it will print the error message to the terminal.
  const viewResult = execSync(`npm view ${pkgTagged} 2>/dev/null`, {
    shell: true,
  }).toString();
  const existingPackage = viewResult
    .split('\n')
    .filter(Boolean)
    .at(0)
    .split(' ')
    .at(0);
  console.warn(`Package ${existingPackage} is already published.`);
  process.exit(0);
} catch (error) {
  console.info(
    `Package ${pkgTagged} is not published yet. Proceeding to publish.`,
  );
}

// Execute "npm publish" to publish
console.info(`npm publish --access public --tag=${tag} --registry=${registry}`);
execSync(`npm publish --access public --tag=${tag} --registry=${registry}`);

process.exit(0);
