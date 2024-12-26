import type { PluginConfig } from '@code-pushup/models';
import { name as packageName, version } from '../../package.json';
import {
  AUDITS,
  DEFAULT_TS_CONFIG,
  GROUPS,
  TYPESCRIPT_PLUGIN_SLUG,
} from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import type { TypescriptPluginOptions } from './types.js';
import { filterAuditsBySlug, filterGroupsByAuditSlug } from './utils.js';

export async function typescriptPlugin(
  options?: TypescriptPluginOptions,
): Promise<PluginConfig> {
  const { tsConfigPath = DEFAULT_TS_CONFIG, onlyAudits } = options ?? {};
  // const defaultConfig = loadDefaultTsConfig(await getCurrentTsVersion());
  // console.log(defaultConfig);
  const filteredAudits = AUDITS.filter(filterAuditsBySlug(onlyAudits));
  const filteredGroups = GROUPS.filter(filterGroupsByAuditSlug(onlyAudits));
  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName,
    version,
    title: 'Typescript',
    description: 'Official Code PushUp typescript plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
    icon: 'typescript',
    audits: filteredAudits,
    groups: filteredGroups,
    runner: createRunnerFunction({ tsConfigPath, filteredAudits }),
  };
}
