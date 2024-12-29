// Run typescript init (with a version specified) to generate a tsconfig.json that will have all defaults listed.
// store this json per ts version in src/default-configs.ts
// get a list of TS version, maybe from npm and somehow filter only versions
import { rm, writeFile } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { join } from 'node:path';
import type { CompilerOptions } from 'typescript';
import {
  ensureDirectoryExists,
  executeProcess,
  readTextFile,
} from '@code-pushup/utils';
import {
  TS_CONFIG_DIR,
  getTsDefaultsFilename,
} from '../lib/runner/constants.js';
import type { SemVerString } from '../lib/runner/types.js';
import { getCurrentTsVersion } from '../lib/runner/utils.js';

export const TS_CONFIG_DIR_NODE_MODULES = join('..', '..', TS_CONFIG_DIR);

export async function generateDefaultTsConfig(
  options: {
    cacheDir?: string;
    version?: SemVerString;
  } = {},
) {
  const {
    cacheDir = TS_CONFIG_DIR_NODE_MODULES,
    version = await getCurrentTsVersion(),
  } = options;
  const tmpDir = join(cacheDir, 'tmp', version);
  // generate raw defaults for version
  await ensureDirectoryExists(cacheDir);
  await generateRawTsConfigFile(tmpDir, version);
  // parse and save raw defaults
  await ensureDirectoryExists(cacheDir);
  await writeFile(
    join(cacheDir, getTsDefaultsFilename(version)),
    JSON.stringify(await extractTsConfig(tmpDir, version), null, 2),
  );
  // cleanup MPP cache and filesystem artefacts
  await rm(tmpDir, { recursive: true });
  await cleanupNpmCache(version);
}

export async function generateRawTsConfigFile(
  cacheDir: string,
  version: SemVerString,
) {
  const dir = join(cacheDir);
  await ensureDirectoryExists(cacheDir);
  await executeProcess({
    command: 'npx',
    args: [
      // always install
      '-y',
      // install+use the version
      `-p=typescript@${version}`,
      // create tsconfig.json at cwd
      'tsc',
      '--init',
    ],
    cwd: dir,
  });
}

/**
 * Extract the json form the generated `tsconfig.json` and store data under `version` in `knownConfigMap`
 * @param cacheDir
 * @param version
 */
export async function extractTsConfig(
  cacheDir: string,
  version: SemVerString,
): Promise<CompilerOptions> {
  try {
    return parseTsConfigJson(
      await readTextFile(join(cacheDir, 'tsconfig.json')),
    );
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
