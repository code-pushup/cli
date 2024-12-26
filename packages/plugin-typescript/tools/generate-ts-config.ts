// Run typescript init (with a version specified) to generate a tsconfig.json that will have all defaults listed.
// store this json per ts version in src/default-configs.ts
// get a list of TS version, maybe from npm and somehow filter only versions

/*
0. In a chron job on GitHub
1. Load known config defaults for TS versions from the `src/lib/ts-config` folder. The files are named after the TS version e.g. `1.4.2.ts`.
2. Load all existing ts versions from NPM. `npm view typescript versions --json`
2.1. filter for relevant releases `relevantVersions` (only 3 version segments e.g. `3.4.1`):
  - start from `1.6.2` as before that there was no init
  - skip all pre-release versions: like `3.5.0-dev.20190404`, `3.6.3-insiders.20190909`, and release candidates like `3.6.1-rc`
3. Iterate over `version` in `relevantVersions`
3.1. If the `version` is present in `knownConfigMap` continue
3.2 Else, run `npx -y -p=typescript@<version> tsc --init`
3.3 If the config is identical to the previous version stored in `knownConfigMap` continue
3.4 Else, extract the json form the generated `tsconfig.json` and store data under `version` in `knownConfigMap`
4. Optional cleanup run `npm uninstall typescript@5.4.2 -g`
5. Save new known configs into `src/lib/ts-config-per-version.ts`
*/
import { executeProcess } from '@push-based/nx-verdaccio/src/internal/execute-process';
import { ensureDirectoryExists } from '@push-based/nx-verdaccio/src/internal/file-system';
import { readdir, writeFile } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { basename, join } from 'node:path';
import * as process from 'node:process';
import type { CompilerOptions } from 'typescript';
import { readTextFile } from '@code-pushup/utils';
import type {SemVerString} from "../src/lib/types.js";

export const TS_CONFIG_DIR = join(
  'packages',
  'plugin-typescript',
  'src',
  'lib',
  'default-ts-configs',
);
export const TMP_TS_CONFIG_DIR = join('tmp', 'plugin-typescript-ts-config');

/**
 * As typescript does not expose a way to get the default config, we need to maintain them programmatically.
 * To save memory and have a cleaner git diff we store the configs per version in separate files.
 *
 * Folder structure
 *
 * src/lib/ts-config
 * ├── 1.4.2.ts
 * ├── 1.4.3.ts
 * ├── ....ts
 *
 * @example
 * // src/lib/ts-config/1.4.2.ts
 *
 * export default {
 *  "compilerOptions": {
 *  "target": "es5",
 *  "module": "commonjs",
 *  "outDir": "./dist",
 *  "rootDir": "./src",
 *  "strict": true,
 *  "esModuleInterop": true,
 *  "skipLibCheck": true,
 *  }
 * }
 */

/**
 * Iterate over `version` in `relevantVersions`
 * If the `version` is present in `knownConfigMap` continue
 * Else, run `npx -y -p=typescript@<version> tsc --init`
 * If the config is identical to the previous version stored in `knownConfigMap` continue
 * Else, extract the json form the generated `tsconfig.json` and store data under `version` in `knownConfigMap`
 * Optional cleanup run `npm uninstall typescript@5.4.2 -g`
 *
 * @param version
 * @param config
 */
export async function updateKnownConfigMap() {
  const knownVersions = await loadKnownVersions();
  const relevantVersions = await getRelevantVersions();
  const versionsToGenerate = relevantVersions.filter(
    version => !knownVersions.includes(version),
  );

  console.info(
    `Generate TS config defaults for ${versionsToGenerate.length} versions: `,
  );
  console.info(versionsToGenerate);

  await Promise.all(versionsToGenerate.map(saveDefaultTsConfig));
}

export async function saveDefaultTsConfig(version: SemVerString) {
  await generateTsConfigFile(version);
  const config = await extractTsConfig(version);
  await cleanupNpmCache(version);
  return writeFile(
    join(TS_CONFIG_DIR, `${version}.ts`),
    [
      `const config = ${JSON.stringify(config, null, 2)}`,
      `export default config;`,
    ].join('\n'),
  );
}

export async function generateTsConfigFile(version: SemVerString) {
  const dir = join(TMP_TS_CONFIG_DIR, version);
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
  const dir = join(TMP_TS_CONFIG_DIR, version);
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
 * Load known config defaults for TS versions from the `src / lib / ts - config` folder. The files are named after the TS version e.g. `1.4.2.ts`.
 */
export async function loadKnownVersions() {
  await ensureDirectoryExists(TS_CONFIG_DIR);
  // load known config defaults for TS versions from the `src / lib / ts - config` folder. The files are named after the TS version e.g. `1.4.2.ts`.
  const dirContent = await readdir(join(process.cwd(), TS_CONFIG_DIR));
  return dirContent.map(
    file => basename(file).replace('.ts', '') as SemVerString,
  );
}

/**
 * Loads all existing TS versions from NPM via `npm view typescript versions--json`.
 * Filter for relevant releases `relevantVersions` (only 3 version segments e.g. `3.4.1`):
 *   - start from `1.6.2` as before that there was no init
 *   - skip all pre-release versions: like `3.5.0 - dev.20190404`, `3.6.3 - insiders.20190909`, and release candidates like `3.6.1 - rc`
 */
export async function getRelevantVersions() {
  const { stdout } = await executeProcess({
    command: 'npm',
    args: ['view', 'typescript', 'versions', '--json'],
  });
  const allVersions: SemVerString[] = JSON.parse(stdout);
  return allVersions.filter(version => {
    const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
    return (
      major >= 1 &&
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      minor >= 6 &&
      patch >= 2 &&
      !version.includes('rc') &&
      !version.includes('dev') &&
      !version.includes('insiders')
    );
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
