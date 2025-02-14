import type { CompilerOptions } from 'typescript';
import type { Audit, CategoryConfig, CategoryRef } from '@code-pushup/models';
import { kebabCaseToCamelCase } from '@code-pushup/utils';
import { AUDITS, GROUPS, TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import type { FilterOptions, TypescriptPluginOptions } from './types.js';

/**
 * It filters the audits by the slugs
 *
 * @param slugs
 */
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

export function getGroups(options?: TypescriptPluginOptions) {
  return GROUPS.map(group => ({
    ...group,
    refs: group.refs.filter(filterAuditsBySlug(options?.onlyAudits)),
  })).filter(group => group.refs.length > 0);
}

export function getAudits(options?: FilterOptions) {
  return AUDITS.filter(filterAuditsBySlug(options?.onlyAudits));
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
  return getGroups(opt).map(({ slug }) => ({
    plugin: TYPESCRIPT_PLUGIN_SLUG,
    slug,
    weight: 1,
    type: 'group',
  }));
}

/**
 * Retrieve the category references from the audits.
 * @param opt TSPluginOptions
 * @returns The array of category references
 */
export async function getCategoryRefsFromAudits(
  opt?: TypescriptPluginOptions,
): Promise<CategoryRef[]> {
  return AUDITS.filter(filterAuditsBySlug(opt?.onlyAudits)).map(({ slug }) => ({
    plugin: TYPESCRIPT_PLUGIN_SLUG,
    slug,
    weight: 1,
    type: 'audit',
  }));
}

export const CATEGORY_MAP: Record<string, CategoryConfig> = {
  typescript: {
    slug: 'type-safety',
    title: 'Type Safety',
    description: 'TypeScript diagnostics and type-checking errors',
    refs: await getCategoryRefsFromGroups(),
  },
  'bug-prevention': {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    description: 'Type checks that find **potential bugs** in your code.',
    refs: await getCategoryRefsFromGroups({
      onlyAudits: [
        'syntax-errors',
        'semantic-errors',
        'internal-errors',
        'configuration-errors',
        'no-implicit-any-errors',
      ],
    }),
  },
  miscellaneous: {
    slug: 'miscellaneous',
    title: 'Miscellaneous',
    description:
      'Errors that do not bring any specific value to the developer, but are still useful to know.',
    refs: await getCategoryRefsFromGroups({
      onlyAudits: ['unknown-codes', 'declaration-and-language-service-errors'],
    }),
  },
};

export function getCategories() {
  return Object.values(CATEGORY_MAP);
}

export function logSkippedAudits(audits: Audit[]) {
  const skippedAudits = AUDITS.filter(
    audit => !audits.some(filtered => filtered.slug === audit.slug),
  ).map(audit => kebabCaseToCamelCase(audit.slug));
  if (skippedAudits.length > 0) {
    console.warn(`Skipped audits: [${skippedAudits.join(', ')}]`);
  }
}
