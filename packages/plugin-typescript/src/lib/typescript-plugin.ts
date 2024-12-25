import type { PluginConfig } from '@code-pushup/models';
import packageJson from '../../package.json';
import type { TypescriptPluginOptions } from './config.js';
import { AUDITS, GROUPS, TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import { filterAuditsBySlug, filterGroupsByAuditSlug } from './utils.js';

export function typescriptPlugin(
  options: TypescriptPluginOptions,
): PluginConfig {
  const audits = AUDITS.filter(filterAuditsBySlug(options.onlyAudits));
  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'Typescript',
    description: 'Official Code PushUp typescript plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
    icon: 'typescript',
    audits,
    groups: GROUPS.filter(filterGroupsByAuditSlug(options.onlyAudits)),
    runner: createRunnerFunction({ ...options, audits }),
  };
}
