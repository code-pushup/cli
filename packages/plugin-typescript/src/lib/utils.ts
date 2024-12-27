import type { CompilerOptions } from 'typescript';
import type { Audit, CategoryRef } from '@code-pushup/models';
import { kebabCaseToCamelCase } from '@code-pushup/utils';
import {
  AUDITS,
  DEFAULT_TS_CONFIG,
  GROUPS,
  TYPESCRIPT_PLUGIN_SLUG,
} from './constants.js';
import { TS_ERROR_CODES } from './runner/ts-error-codes.js';
import {
  getCurrentTsVersion,
  loadTargetConfig,
  loadTsConfigDefaultsByVersion,
} from './runner/utils.js';
import type { TypescriptPluginOptions } from './types.js';

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
function auditSlugToCompilerOption(slug: string): string {
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
export function filterAuditsByCompilerOptions(
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

export function getGroups(
  compilerOptions: CompilerOptions,
  options?: TypescriptPluginOptions,
) {
  return GROUPS.map(group => ({
    ...group,
    refs: group.refs.filter(
      filterAuditsByCompilerOptions(
        compilerOptions,
        (options ?? {})?.onlyAudits,
      ),
    ),
  })).filter(group => group.refs.length > 0);
}

export function getAudits(
  definitive: CompilerOptions,
  options?: TypescriptPluginOptions,
) {
  return AUDITS.filter(
    filterAuditsByCompilerOptions(definitive, options?.onlyAudits),
  );
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
  const definitive = await normalizeCompilerOptions(opt);
  return GROUPS.map(group => ({
    ...group,
    refs: group.refs.filter(
      filterAuditsByCompilerOptions(definitive, opt?.onlyAudits),
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

/**
 * It will from the options, and the TS Version, get a final compiler options to be used later for filters
 * Once it's processed for the first time, it will store the information in a variable, to be retrieve
 * later if existing
 * @param options Plugin options
 */
export async function normalizeCompilerOptions(
  options?: TypescriptPluginOptions,
) {
  const { tsConfigPath = DEFAULT_TS_CONFIG } = options ?? {};
  const { compilerOptions: defaultCompilerOptions } =
    await loadTsConfigDefaultsByVersion(await getCurrentTsVersion());
  const config = await loadTargetConfig(tsConfigPath);
  return handleCompilerOptionStrict({
    ...defaultCompilerOptions,
    ...config.options,
  });
}

export function validateAudits(filteredAudits: Audit[]) {
  const skippedAudits = AUDITS.filter(
    audit => !filteredAudits.some(filtered => filtered.slug === audit.slug),
  ).map(audit => kebabCaseToCamelCase(audit.slug));

  if (skippedAudits.length > 0) {
    console.warn(
      `Some audits were skipped because the configuration of the compiler options [${skippedAudits.join(', ')}]`,
    );
  }
}
