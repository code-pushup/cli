import type { PluginConfig } from '@code-pushup/models';
import packageJson from '../../package.json';
import type { TypescriptPluginOptions } from './config.js';
import { TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { AUDITS } from './generated/audits.js';
import { createRunnerFunction } from './runner/runner.js';
import { filterAuditsBySlug } from './utils.js';

export const PLUGIN_TITLE = 'Typescript';

export const PLUGIN_DESCRIPTION = 'Official Code PushUp typescript plugin.';

export const PLUGIN_DOCS_URL =
  'https://www.npmjs.com/package/@code-pushup/typescript-plugin/';

export function typescriptPlugin(
  options: TypescriptPluginOptions,
): PluginConfig {
  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: PLUGIN_TITLE,
    description: PLUGIN_DESCRIPTION,
    docsUrl: PLUGIN_DOCS_URL,
    icon: 'typescript',
    audits: AUDITS.filter(filterAuditsBySlug(options.onlyAudits)),
    groups: [],
    runner: createRunnerFunction(options),
  };
}
