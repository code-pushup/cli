// Run typescript init (with a version specified) to generate a tsconfig.json that will have all defaults listed.
// store this json per ts version in src/default-configs.ts
// get a list of TS version, maybe from npm and somehow filter only versions
import { rm, writeFile } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { dirname, join } from 'node:path';
import type { CompilerOptions } from 'typescript';
import {
  ensureDirectoryExists,
  executeProcess,
  readTextFile,
} from '@code-pushup/utils';
import type { SemVerString } from '../lib/runner/types.js';
import { getCurrentTsVersion } from '../lib/runner/utils.js';

const normalizedTsConfigFolder = join(
  '..',
  '..',
  '.code-pushup',
  'typescript-plugin',
  'default-ts-configs',
);
const tmpDir = join(normalizedTsConfigFolder, 'tmp');

export async function generateDefaultTsConfig(version: SemVerString) {
  await ensureDirectoryExists(normalizedTsConfigFolder);
  await generateRawTsConfigFile(version);
  const config = await extractTsConfig(version);
  await cleanupArtefacts();
  await cleanupNpmCache(version);
  await writeFile(
    join(normalizedTsConfigFolder, `${version}.js`),
    [
      `const config = ${JSON.stringify(config, null, 2)}`,
      `export default config;`,
    ].join('\n'),
  );
  console.log(
    `Generated default TS config for version ${version} under ${normalizedTsConfigFolder}`,
  );
}

export async function generateRawTsConfigFile(version: SemVerString) {
  const dir = join(tmpDir, version);
  await ensureDirectoryExists(dir);
  await executeProcess({
    command: 'npx',
    args: ['-y', `-p=typescript@${version}`, 'tsc', '--init'],
    cwd: dir,
  });
}

/**
 * Extract the json form the generated `tsconfig.json` and store data under `version` in `knownConfigMap`
 * @param version
 */
export async function extractTsConfig(
  version: SemVerString,
): Promise<CompilerOptions> {
  const dir = join(tmpDir, version);
  await ensureDirectoryExists(dir);
  try {
    return parseTsConfigJson(await readTextFile(join(dir, 'tsconfig.json')));
  } catch (error) {
    throw new Error(
      `Failed to extract tsconfig.json for version ${version}. \n ${(error as Error).message}`,
    );
  }
}

/**
 * Cleanup run `npm uninstall typescript@5.4.2 -g`
 * @param version
 */
export async function cleanupNpmCache(version: SemVerString) {
  await executeProcess({
    command: 'npm',
    args: ['uninstall', `typescript@${version}`, '-g'],
  });
}

/**
 * Cleanup artefacts`
 * @param version
 */
export async function cleanupArtefacts() {
  await rm(tmpDir, { recursive: true });
}

/**
 * Parse the tsconfig.json file content into a CompilerOptions object.
 * tsconfig.json files can have comments and trailing commas, which are not valid JSON.
 * This function removes comments and trailing commas and parses the JSON.
 * @param fileContent
 */
export function parseTsConfigJson(fileContent: string) {
  const parsedFileContent = fileContent
    .trim()
    .split('\n')
    .map(line =>
      line
        // replace all /**/ comments with empty string
        .replace(/\/\*.*\*\//g, '')
        // replace all // strings with empty string
        .replace(/\/\//g, '')
        .replace(/:\s*([^,\n\r]*)\s*\/\/.*$/gm, ': $1')
        .replace(/,(\s*[}\]])/gm, '$1')
        .trim(),
    )
    .filter(s => s !== '')
    // missing comma dua to newly uncommented lines
    .map(s => {
      // if is si noa a opening or closing  object bracket "{" or "}"
      if (!/[{}[]$/.test(s)) {
        // add a comma at the end it is missing
        return s.replace(/:\s*([^,]*)$/, ': $1,');
      }
      return s;
    })
    .join('')
    // remove dangling commas
    .replace(/,\s*}/gm, '}');
  return JSON.parse(parsedFileContent) as CompilerOptions;
}

export async function generateCurrentTsConfig(version?: SemVerString) {
  return generateDefaultTsConfig(
    version ?? ((await getCurrentTsVersion()) as SemVerString),
  );
}
