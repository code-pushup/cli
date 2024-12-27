import type {PluginConfig} from '@code-pushup/models';
import {name as packageName, version} from '../../package.json';
import {AUDITS, DEFAULT_TS_CONFIG, TYPESCRIPT_PLUGIN_SLUG,} from './constants.js';
import {createRunnerFunction} from './runner/runner.js';
import type {TypescriptPluginOptions} from './types.js';
import {filterAuditsByTsOptions, getCompilerOptionsToDetermineListedAudits, getGroups} from './utils.js';
import {kebabCaseToCamelCase} from "@code-pushup/utils";

export async function typescriptPlugin(
  options?: TypescriptPluginOptions,
): Promise<PluginConfig> {

  const {tsConfigPath} = options ?? {tsConfigPath: DEFAULT_TS_CONFIG};
  const definitive = await getCompilerOptionsToDetermineListedAudits(options);

  const filteredAudits = AUDITS
    .filter(filterAuditsByTsOptions(definitive, options?.onlyAudits));
  const filteredGroups = getGroups(definitive, options);

  const skippedAudits = AUDITS
    .filter(audit => !filteredAudits.some(filtered => filtered.slug === audit.slug))
    .map(audit => kebabCaseToCamelCase(audit.slug));

  if(skippedAudits.length > 0){
    console.warn(`Some audits were skipped because the configuration of the compiler options [${skippedAudits.join(', ')}]`);
  }

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
    runner: createRunnerFunction({
      tsConfigPath,
      filteredAudits
    }),
  };
}
