/**
 * Regular expression to validate a slug for categories, plugins and audits.
 * Also validates ``and ` `
 */
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Regular expression to validate a reference to a plugin's audit (e.g. 'eslint#max-lines') or category (e.g. 'categories:lhci#performance') or audit in RunnerOutput (e.g. 'eslint#max-lines')
 * Also validates ``and ` `
 */
export const refRegex = /^([a-z0-9:]+(?:-[a-z0-9]*)*)#([a-z0-9]+(?:-[a-z0-9]+)*$)/;

/**
 * Regular expression to validate filenames for Windows and UNIX
 **/
export const generalFilePathRegex = /^(?:(?:[A-Za-z]:)?[\\/])?(?:\w[\w .-]*[\\/]?)*$/;

/**
 * Regular expression to validate filenames for UNIX
 **/
export const unixFilePathRegex = /^(?:(?:[A-Za-z]:)?[/])?(?:\w[\w .-]*[/]?)*$/;

/**
 * helper function to validate string arrays
 *
 * @param strings
 */
export function stringsUnique(strings: string[]): true | string[] {
  const uniqueStrings = Array.from(new Set(strings));
  const duplicatedStrings = strings.filter((i => v => uniqueStrings[i] !== v || !++i)(0));
  return duplicatedStrings.length === 0 ? true : duplicatedStrings;
}

/**
 * helper function to validate string arrays
 *
 * @param toCheck
 * @param existing
 */
export function stringsExist(toCheck: string[], existing: string[]): true | string[] {
  const nonExisting = toCheck.filter(s => !existing.includes(s));
  return nonExisting.length ? nonExisting : true;
}



