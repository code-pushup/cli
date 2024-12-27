import type { PluginConfig } from '@code-pushup/models';
import { name as packageName, version } from '../../package.json';
import { DEFAULT_TS_CONFIG, TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import type { TypescriptPluginOptions } from './types.js';
import {
  getAudits,
  getGroups,
  normalizeCompilerOptions,
  validateAudits,
} from './utils.js';

export async function typescriptPlugin(
  options?: TypescriptPluginOptions,
): Promise<PluginConfig> {
  const { tsConfigPath } = options ?? { tsConfigPath: DEFAULT_TS_CONFIG };

  const compilerOptions = await normalizeCompilerOptions(options);
  const filteredAudits = getAudits(compilerOptions, options);
  const filteredGroups = getGroups(compilerOptions, options);

  validateAudits(filteredAudits);

  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName,
    version,
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
