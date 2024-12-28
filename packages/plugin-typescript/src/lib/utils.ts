import type { CompilerOptions } from 'typescript';
import type { Audit, CategoryRef } from '@code-pushup/models';
import { kebabCaseToCamelCase } from '@code-pushup/utils';
import {
  AUDITS,
  DEFAULT_TS_CONFIG,
  GROUPS,
  TYPESCRIPT_PLUGIN_SLUG,
} from './constants.js';
import { normalizeCompilerOptions } from './normalize-compiler-options.js';
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
 * By default, kebabCaseToCamelCase.
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
      option !== false &&
      option !== undefined &&
      filterAuditsBySlug(onlyAudits)({ slug })
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
        (options ?? {}).onlyAudits,
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
  const { tsConfigPath } = opt ?? { tsConfigPath: DEFAULT_TS_CONFIG };
  const definitive = await normalizeCompilerOptions({ ...opt, tsConfigPath });
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

export function logSkippedAudits(audits: Audit[]) {
  const skippedAudits = AUDITS.filter(
    audit => !audits.some(filtered => filtered.slug === audit.slug),
  ).map(audit => kebabCaseToCamelCase(audit.slug));
  if (skippedAudits.length > 0) {
    console.warn(
      `Skipped audits because the compiler options disabled: [${skippedAudits.join(', ')}]`,
    );
  }
}
