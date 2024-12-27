import { access } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { dirname } from 'node:path';
import {
  type CompilerOptions,
  type ParsedCommandLine,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys,
} from 'typescript';
import type { CategoryRef, Group } from '@code-pushup/models';
import {
  camelCaseToKebabCase,
  executeProcess,
  kebabCaseToCamelCase,
  readTextFile,
} from '@code-pushup/utils';
import {
  DEFAULT_TS_CONFIG,
  GROUPS,
  TYPESCRIPT_PLUGIN_SLUG,
} from './constants.js';
import { TS_ERROR_CODES } from './runner/ts-error-codes.js';
import type {
  AuditSlug,
  SemVerString,
  TypescriptPluginOptions,
} from './types.js';

export function filterAuditsBySlug(slugs?: string[]) {
  return ({ slug }: { slug: string }) => {
    if (slugs && slugs.length > 0) {
      return slugs.includes(slug);
    }
    return true;
  };
}

/**
 * It transforms a slug code to a compiler option format
 * By default, kebabCabeToCamelCase.
 * It will handle also cases like emit-bom that it should be emit-BOM
 * @param slug Slug to be transformed
 * @returns The slug as compilerOption key
 */
export function auditSlugToCompilerOption(slug: string): string {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (slug) {
    case 'emit-bom':
      return 'emitBOM';
    default:
      return kebabCaseToCamelCase(slug);
  }
}

/**
 * From a list of audits, it will filter out the ones that might have been disabled from the compiler options
 * plus from the parameter onlyAudits
 * @param compilerOptions Compiler options
 * @param onlyAudits OnlyAudits
 * @returns Filtered Audits
 */
export function filterAuditsByTsOptions(
  compilerOptions: CompilerOptions,
  onlyAudits?: string[],
) {
  return ({ slug }: { slug: string }) => {
    const option = compilerOptions[auditSlugToCompilerOption(slug)];
    return (
      option !== false && option !== undefined && filterAuditsBySlug(onlyAudits)
    );
  };
}

export function filterGroupsByAuditSlug(slugs?: string[]) {
  return ({ refs }: Group) => refs.some(filterAuditsBySlug(slugs));
}

export function getGroups(
  compilerOptions: CompilerOptions,
  onlyAudits?: string[],
) {
  return GROUPS.map(group => ({
    ...group,
    refs: group.refs.filter(
      filterAuditsByTsOptions(compilerOptions, onlyAudits),
    ),
  })).filter(group => group.refs.length > 0);
}

/**
 * Retrieve the category references from the groups (already processed from the audits).
 * Used in the code-pushup preset
 * @param opt TSPluginOptions
 * @returns The array of category references
 */
export async function getCategoryRefsFromGroups(
  opt?: TypescriptPluginOptions,
): Promise<CategoryRef[]> {
  const definitive = await getCompilerOptionsToDetermineListedAudits(opt);
  return GROUPS.map(group => ({
    ...group,
    refs: group.refs.filter(
      filterAuditsByTsOptions(definitive, opt?.onlyAudits),
    ),
  }))
    .filter(group => group.refs.length > 0)
    .map(({ slug }) => ({
      plugin: TYPESCRIPT_PLUGIN_SLUG,
      slug,
      weight: 1,
      type: 'group',
    }));
}

export async function getCurrentTsVersion(): Promise<SemVerString> {
  const { stdout } = await executeProcess({
    command: 'npx',
    args: ['tsc', '--version'],
  });
  return stdout.split(' ').slice(-1).join('').trim() as SemVerString;
}

export async function loadDefaultTsConfig(version: SemVerString) {
  const __dirname = new URL('.', import.meta.url).pathname;
  const configPath = `${__dirname}default-ts-configs/${version}.ts`;

  try {
    await access(configPath);
  } catch {
    throw new Error(`Could not find default TS config for version ${version}.`);
  }

  try {
    const module = await import(configPath);
    return module.default as { compilerOptions: CompilerOptions };
  } catch (error) {
    throw new Error(
      `Could load default TS config for version ${version}. /n ${(error as Error).message}`,
    );
  }
}

/**
 * It will evaluate if the option strict is enabled. If so, it must enable all it's dependencies.
 * [Logic Reference](https://github.com/microsoft/TypeScript/blob/56a08250f3516b3f5bc120d6c7ab4450a9a69352/src/compiler/utilities.ts#L9262)
 * @param options Current compiler options
 * @returns CompilerOptions evaluated.
 */
export function handleCompilerOptionStrict(options: CompilerOptions) {
  if (!options.strict) {
    return options;
  }

  const strictOptions = Object.fromEntries(
    Object.keys(TS_ERROR_CODES.strict).map(key => [key, true]),
  ) as CompilerOptions;

  return {
    ...options,
    ...strictOptions,
  };
}

// eslint-disable-next-line functional/no-let
let _COMPILER_OPTIONS: CompilerOptions;

/**
 * It will from the options, and the TS Version, get a final compiler options to be used later for filters
 * Once it's processed for the first time, it will store the information in a variable, to be retrieve
 * later if existing
 * @param options Plugin options
 */
export async function getCompilerOptionsToDetermineListedAudits(
  options?: TypescriptPluginOptions,
) {
  if (_COMPILER_OPTIONS) {
    return _COMPILER_OPTIONS;
  }
  const { tsConfigPath = DEFAULT_TS_CONFIG } = options ?? {};
  const { compilerOptions: defaultCompilerOptions } = await loadDefaultTsConfig(
    await getCurrentTsVersion(),
  );
  const config = await loadTargetConfig(tsConfigPath);
  const definitiveCompilerOptions = handleCompilerOptionStrict({
    ...defaultCompilerOptions,
    ...config.options,
  });
  _COMPILER_OPTIONS = definitiveCompilerOptions;
  return _COMPILER_OPTIONS;
}

// used in presets
export async function getFinalAuditSlugs(options: TypescriptPluginOptions) {
  const definitive = await getCompilerOptionsToDetermineListedAudits(options);
  return Object.keys(definitive).map(
    key => camelCaseToKebabCase(key) as AuditSlug,
  );
}

const _TS_CONFIG_MAP = new Map<string, ParsedCommandLine>();

export async function loadTargetConfig(tsConfigPath: string) {
  if (_TS_CONFIG_MAP.get(tsConfigPath) === undefined) {
    const { config } = parseConfigFileTextToJson(
      tsConfigPath,
      await readTextFile(tsConfigPath),
    );

    const parsedConfig = parseJsonConfigFileContent(
      config,
      sys,
      dirname(tsConfigPath),
    );

    if (parsedConfig.fileNames.length === 0) {
      throw new Error(
        'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
      );
    }

    _TS_CONFIG_MAP.set(tsConfigPath, parsedConfig);
  }
  return _TS_CONFIG_MAP.get(tsConfigPath) as ParsedCommandLine;
}
