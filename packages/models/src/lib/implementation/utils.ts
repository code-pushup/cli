/**
 * Regular expression to validate a slug for categories, plugins and audits.
 * - audit (e.g. 'max-lines')
 * - category (e.g. 'performance')
 * Also validates ``and ` `
 */
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Regular expression to validate a reference to a plugin's:
 * - audit (e.g. 'eslint#max-lines')
 * - or group (e.g. lighthouse#group:performance)
 * Also validates ``and ` `
 */
export const refRegex =
  /^([a-z0-9:]+(?:-[a-z0-9]*)*)#(group:)*([a-z0-9]+(?:-[a-z0-9]+)*$)/;

/**
 * Regular expression to validate filenames for Windows and UNIX
 **/
export const generalFilePathRegex =
  /^(?:(?:[A-Za-z]:)?[\\/])?(?:\w[\w .-]*[\\/]?)*$/;

/**
 * Regular expression to validate filenames for UNIX
 **/
export const unixFilePathRegex = /^(?:(?:[A-Za-z]:)?[/])?(?:\w[\w .-]*[/]?)*$/;

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
