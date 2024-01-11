import type { CategoryConfig } from '../category-config';
import type { PluginConfig } from '../plugin-config';
import type { PluginReport } from '../report';

/**
 * Regular expression to validate a slug for categories, plugins and audits.
 * - audit (e.g. 'max-lines')
 * - category (e.g. 'performance')
 * Also validates ``and ` `
 */
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Regular expression to validate a filename.
 */
export const filenameRegex = /^(?!.*[ \\/:*?"<>|]).+$/;

/**
 * helper function to validate string arrays
 *
 * @param strings
 */
export function hasDuplicateStrings(strings: string[]): string[] | false {
  const uniqueStrings = Array.from(new Set(strings));
  const duplicatedStrings = strings.filter(
    (
      i => v =>
        uniqueStrings[i] !== v || !++i
    )(0),
  );
  return duplicatedStrings.length === 0 ? false : duplicatedStrings;
}

/**
 * helper function to validate string arrays
 *
 * @param toCheck
 * @param existing
 */
export function hasMissingStrings(
  toCheck: string[],
  existing: string[],
): string[] | false {
  const nonExisting = toCheck.filter(s => !existing.includes(s));
  return nonExisting.length === 0 ? false : nonExisting;
}

/**
 * helper for error items
 */
export function errorItems(
  items: string[] | false,
  transform: (items: string[]) => string = items => items.join(', '),
): string {
  const paredItems = items ? items : [];
  return transform(paredItems);
}

export function exists<T>(value: T): value is NonNullable<T> {
  return value != null;
}

/**
 * Get category references that do not point to any audit or group
 * @param categories
 * @param plugins
 * @returns Array of missing references.
 */
export function getMissingRefsForCategories(
  categories: CategoryConfig[],
  plugins: PluginConfig[] | PluginReport[],
) {
  const missingRefs: string[] = [];
  const auditRefsFromCategory = categories.flatMap(({ refs }) =>
    refs
      .filter(({ type }) => type === 'audit')
      .map(({ plugin, slug }) => `${plugin}/${slug}`),
  );
  const auditRefsFromPlugins = plugins.flatMap(
    ({ audits, slug: pluginSlug }) => {
      return audits.map(({ slug }) => `${pluginSlug}/${slug}`);
    },
  );
  const missingAuditRefs = hasMissingStrings(
    auditRefsFromCategory,
    auditRefsFromPlugins,
  );

  if (Array.isArray(missingAuditRefs) && missingAuditRefs.length > 0) {
    missingRefs.push(...missingAuditRefs);
  }
  const groupRefsFromCategory = categories.flatMap(({ refs }) =>
    refs
      .filter(({ type }) => type === 'group')
      .map(({ plugin, slug }) => `${plugin}#${slug} (group)`),
  );
  const groupRefsFromPlugins = plugins.flatMap(
    ({ groups, slug: pluginSlug }) => {
      return Array.isArray(groups)
        ? groups.map(({ slug }) => `${pluginSlug}#${slug} (group)`)
        : [];
    },
  );
  const missingGroupRefs = hasMissingStrings(
    groupRefsFromCategory,
    groupRefsFromPlugins,
  );
  if (Array.isArray(missingGroupRefs) && missingGroupRefs.length > 0) {
    missingRefs.push(...missingGroupRefs);
  }

  return missingRefs.length ? missingRefs : false;
}
export function missingRefsForCategoriesErrorMsg(
  categories: CategoryConfig[],
  plugins: PluginConfig[] | PluginReport[],
) {
  const missingRefs = getMissingRefsForCategories(categories, plugins);
  return `The following category references need to point to an audit or group: ${errorItems(
    missingRefs,
  )}`;
}
