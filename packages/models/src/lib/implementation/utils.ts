import type { CategoryConfig } from '../category-config';
import type { PluginConfig } from '../plugin-config';
import type { PluginReport } from '../report';

/**
 * Regular expression to validate a slug for categories, plugins and audits.
 * - audit (e.g. 'max-lines')
 * - category (e.g. 'performance')
 * Also validates ``and ` `
 */
export const slugRegex = /^[a-z\d]+(?:-[a-z\d]+)*$/;

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
  const sortedStrings = strings.toSorted();
  const duplStrings = sortedStrings.filter(
    (item, index) => index !== 0 && item === sortedStrings[index - 1],
  );

  return duplStrings.length === 0 ? false : [...new Set(duplStrings)];
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
  transform: (itemArr: string[]) => string = itemArr => itemArr.join(', '),
): string {
  return transform(items || []);
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
  if (categories.length === 0) {
    return false;
  }

  const auditRefsFromCategory = categories.flatMap(({ refs }) =>
    refs
      .filter(({ type }) => type === 'audit')
      .map(({ plugin, slug }) => `${plugin}/${slug}`),
  );
  const auditRefsFromPlugins = plugins.flatMap(({ audits, slug: pluginSlug }) =>
    audits.map(({ slug }) => `${pluginSlug}/${slug}`),
  );
  const missingAuditRefs = hasMissingStrings(
    auditRefsFromCategory,
    auditRefsFromPlugins,
  );

  const groupRefsFromCategory = categories.flatMap(({ refs }) =>
    refs
      .filter(({ type }) => type === 'group')
      .map(({ plugin, slug }) => `${plugin}#${slug} (group)`),
  );
  const groupRefsFromPlugins = plugins.flatMap(({ groups, slug: pluginSlug }) =>
    Array.isArray(groups)
      ? groups.map(({ slug }) => `${pluginSlug}#${slug} (group)`)
      : [],
  );
  const missingGroupRefs = hasMissingStrings(
    groupRefsFromCategory,
    groupRefsFromPlugins,
  );

  const missingRefs = [missingAuditRefs, missingGroupRefs]
    .filter((refs): refs is string[] => Array.isArray(refs) && refs.length > 0)
    .flat();

  return missingRefs.length > 0 ? missingRefs : false;
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
