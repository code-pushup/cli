import type { CategoryConfig } from '../category-config.js';
import type { PluginConfig } from '../plugin-config.js';
import type { PluginReport } from '../report.js';

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

export function formatSlugsList(slugs: string[]): string {
  return slugs.map(slug => `"${slug}"`).join(', ');
}

/**
 * helper for error items
 */
export function errorItems(
  items: string[],
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
  categories: CategoryConfig[] | undefined,
  plugins: PluginConfig[] | PluginReport[],
) {
  if (!categories || categories.length === 0) {
    return false;
  }

  const auditRefsFromCategory = categories.flatMap(({ refs }) =>
    refs.filter(({ type }) => type === 'audit').map(formatRef),
  );
  const auditRefsFromPlugins = plugins.flatMap(({ audits, slug: plugin }) =>
    audits.map(({ slug }) => formatRef({ type: 'audit', plugin, slug })),
  );
  const missingAuditRefs = hasMissingStrings(
    auditRefsFromCategory,
    auditRefsFromPlugins,
  );

  const groupRefsFromCategory = categories.flatMap(({ refs }) =>
    refs.filter(({ type }) => type === 'group').map(formatRef),
  );
  const groupRefsFromPlugins = plugins.flatMap(({ groups, slug: plugin }) =>
    Array.isArray(groups)
      ? groups.map(({ slug }) => formatRef({ type: 'group', plugin, slug }))
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

export function findMissingSlugsInCategoryRefs({
  categories,
  plugins,
}: {
  categories?: CategoryConfig[];
  plugins: PluginConfig[] | PluginReport[];
}) {
  const missingRefs = getMissingRefsForCategories(categories, plugins);
  return (
    missingRefs && {
      message: `Category references audits or groups which don't exist: ${missingRefs.join(
        ', ',
      )}`,
    }
  );
}

export function formatRef(ref: {
  type: 'audit' | 'group';
  plugin: string;
  slug: string;
}): string {
  return `${ref.type} "${ref.slug}" (plugin "${ref.plugin}")`;
}
