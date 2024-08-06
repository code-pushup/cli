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
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

const { readCachedProjectGraph } = devkit;

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
const {name, ver: version, tag} = yargs(hideBin(process.argv)).options({
  name: { type: 'string', demandOption: true },
  ver: { type: 'string', demandOption: true },
  tag: { type: 'string', default: 'next' },
}).coerce('ver', (ver) => {
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
try {
  const json = JSON.parse(readFileSync(`package.json`).toString());
  json.version = version;
  writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading package.json file from library build output.`);
}

// Execute "npm publish" to publish
execSync(`npm publish --access public --tag ${tag}`);
