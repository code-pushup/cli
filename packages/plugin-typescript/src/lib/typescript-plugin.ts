import type {PluginConfig} from '@code-pushup/models';
import {name as packageName, version} from '../../package.json';
import {AUDITS, DEFAULT_TS_CONFIG, GROUPS, TYPESCRIPT_PLUGIN_SLUG,} from './constants.js';
import {createRunnerFunction} from './runner/runner.js';
import type {AuditSlug, CompilerOptionName, TypescriptPluginOptions} from './types.js';
import {
  filterAuditsByTsOptions,
  filterGroupsByAuditSlug,
  filterGroupsByByTsOptions,
  getCurrentTsVersion,
  loadDefaultTsConfig
} from './utils.js';
import {getTsConfigurationFromPath} from "./runner/typescript-runner.ts";
import {resolve} from "node:path";
import {
  type CompilerOptions,
  formatDiagnosticsWithColorAndContext,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from "typescript";
import {kebabCaseToCamelCase} from "@code-pushup/utils";
import {filterAuditsBySlug} from './utils.js';

export function mergeTsConfigs(baseConfigPath: string, overrideConfigPath: string) {
  // Read and parse the base configuration
  const baseConfigFile = readConfigFile(resolve(baseConfigPath), sys.readFile);
  if (baseConfigFile.error) {
    throw new Error(formatDiagnosticsWithColorAndContext([baseConfigFile.error], sys));
  }

  // Read and parse the override configuration
  const overrideConfigFile = readConfigFile(resolve(overrideConfigPath), sys.readFile);
  if (overrideConfigFile.error) {
    throw new Error(formatDiagnosticsWithColorAndContext([overrideConfigFile.error], sys));
  }

  // Combine the configs by merging their raw JSON
  const mergedRawConfig = {
    ...baseConfigFile.config,
    ...overrideConfigFile.config,
    compilerOptions: {
      ...baseConfigFile.config.compilerOptions,
      ...overrideConfigFile.config.compilerOptions,
    },
  };

  // Parse the merged config into normalized options
  const parsedConfig = parseJsonConfigFileContent(
    mergedRawConfig,
    sys,
    process.cwd()
  );

  if (parsedConfig.errors.length > 0) {
    throw new Error(formatDiagnosticsWithColorAndContext(parsedConfig.errors, sys));
  }

  return parsedConfig.options;
}

export async function typescriptPlugin(
  options?: TypescriptPluginOptions,
): Promise<PluginConfig> {
  const {tsConfigPath = DEFAULT_TS_CONFIG, onlyAudits} = options ?? {};
  const {options: defaultCompilerOptions} = await loadDefaultTsConfig(await getCurrentTsVersion());
  const {compilerOptions: desiredCompilerOptions, fileNames} = await getTsConfigurationFromPath({
    tsConfigPath,
    existingConfig: defaultCompilerOptions
  });

  // merges the defaultCompilerOptions of that TS Version with the compilerOptions configured by the user. EX: user vermatin could be undefined, but the default could be true
  const  compilerOptions: CompilerOptions =  {...defaultCompilerOptions, ...desiredCompilerOptions};



  const filteredAudits = AUDITS
    .filter(filterAuditsByTsOptions(compilerOptions, onlyAudits))

  const filteredGroups = GROUPS.filter(filterGroupsByByTsOptions(compilerOptions, onlyAudits));
  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName,
    version,
    title: 'Typescript',
    description: 'Official Code PushUp typescript plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
    icon: 'typescript',
    audits: filteredAudits,
    // groups: filteredGroups,
    runner: createRunnerFunction({
      fileNames,
      compilerOptions,
      filteredAudits
    }),
  };
}
