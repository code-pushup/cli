import type { PluginConfig } from '@code-pushup/models';
import { DEFAULT_TS_CONFIG, TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import type { TypescriptPluginOptions } from './types.js';
import {
  getAudits,
  getGroups,
  logSkippedAudits,
} from './utils.js';
import {normalizeCompilerOptions} from "./normalize-compiler-options.js";
import {createRequire} from "node:module";

const packageJson = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

export async function typescriptPlugin(
  options?: TypescriptPluginOptions,
): Promise<PluginConfig> {
  const { tsConfigPath } = options ?? { tsConfigPath: DEFAULT_TS_CONFIG };

  const compilerOptions = await normalizeCompilerOptions({tsConfigPath});
  const filteredAudits = getAudits(compilerOptions, options);
  const filteredGroups = getGroups(compilerOptions, options);

  logSkippedAudits(filteredAudits);

  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'Typescript',
    description: 'Official Code PushUp Typescript plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
    icon: 'typescript',
    audits: filteredAudits,
    groups: filteredGroups,
    runner: createRunnerFunction({
      tsConfigPath,
      expectedAudits: filteredAudits,
    }),
  };
}
