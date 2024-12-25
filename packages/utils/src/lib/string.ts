/**
 * Converts a kebab-case string to camelCase.
 * @param string - The kebab-case string to convert.
 * @returns The camelCase string.
 */
export function kebabCaseToCamelCase(string: string) {
  return string
    .split('-')
    .map((segment, index) =>
      index === 0
        ? segment
        : segment.charAt(0).toUpperCase() + segment.slice(1),
    )
    .join('');
}

/**
 * Converts a camelCase string to kebab-case.
 * @param string - The camelCase string to convert.
 * @returns The kebab-case string.
 */
export function camelCaseToKebabCase(string: string): string {
  return string
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // handle consecutive capital letters
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Formats a slug to a readable title.
 * @param slug - The slug to format.
 * @returns The formatted title.
 */
export function kebabCaseToSentence(slug: string = '') {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}
