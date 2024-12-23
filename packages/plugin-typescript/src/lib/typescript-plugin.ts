import type { PluginConfig } from '@code-pushup/models';
import packageJson from '../../package.json';
import { AUDITS } from './audits.js';
import { TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';

export type TypescriptPluginOptions = {
  tsConfigPath?: string;
  tsCodes?: number[];
  sourceGlob?: string;
};

export function typescriptPlugin(
  options: TypescriptPluginOptions,
): PluginConfig {
  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'Typescript',
    icon: 'typescript',
    audits: AUDITS,
    groups: [],
    runner: createRunnerFunction(options),
  };
}
