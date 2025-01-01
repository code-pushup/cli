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

export type CamelCaseToKebabCase<T extends string> =
  T extends `${infer First}${infer Rest}`
    ? Rest extends Uncapitalize<Rest>
      ? `${Lowercase<First>}${CamelCaseToKebabCase<Rest>}`
      : `${Lowercase<First>}-${CamelCaseToKebabCase<Rest>}`
    : T;

/**
 * Converts a camelCase string to kebab-case.
 * @param string - The camelCase string to convert.
 * @returns The kebab-case string.
 */
export function camelCaseToKebabCase<T extends string>(
  string: T,
): CamelCaseToKebabCase<T> {
  return string
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Split between uppercase followed by uppercase+lowercase
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Split between lowercase followed by uppercase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Additional split for consecutive uppercase
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .toLowerCase() as CamelCaseToKebabCase<T>;
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

/**
 * Formats a slug to a readable title.
 * @param slug - The slug to format.
 * @returns The formatted title.
 */
export function camelCaseToSentence(slug: string = '') {
  return slug
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Split between uppercase followed by uppercase+lowercase
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Split between lowercase followed by uppercase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Additional split for consecutive uppercase
    .replace(/[\s_]+/g, ' ') // Replace spaces and underscores with hyphens
    .replace(/\b\w/g, letter => letter.toUpperCase());
}
