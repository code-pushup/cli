import type { PluginConfig } from '@code-pushup/models';
import packageJson from '../../package.json';
import {
  TYPESCRIPT_PLUGIN_SLUG,
  audits,
  errorCodeToCompilerOption,
} from './constants.js';
import { createRunnerFunction } from './runner/runner.js';

export type CamelToKebabCase<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? `${First extends Capitalize<First> ? '-' : ''}${Lowercase<First>}${CamelToKebabCase<Rest>}`
    : '';

export type SupportedCompilerErrorCode = keyof typeof errorCodeToCompilerOption;
export type SupportedCompilerOptions =
  (typeof errorCodeToCompilerOption)[SupportedCompilerErrorCode];
export type AuditSlug = Lowercase<SupportedCompilerOptions>;

export type TypescriptPluginOptions = {
  tsConfigPath?: string;
  onlyAudits?: AuditSlug[];
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
    audits,
    groups: [],
    runner: createRunnerFunction(options),
  };
}
