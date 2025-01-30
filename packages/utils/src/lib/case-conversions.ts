import type { CamelCaseToKebabCase } from './types.js';

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
 * Converts a string to Title Case.
 * - Capitalizes the first letter of each major word.
 * - Keeps articles, conjunctions, and short prepositions in lowercase unless they are the first word.
 *
 * @param input - The string to convert.
 * @returns The formatted title case string.
 */
export function toTitleCase(input: string): string {
  const minorWords = new Set([
    'a',
    'an',
    'the',
    'and',
    'or',
    'but',
    'for',
    'nor',
    'on',
    'in',
    'at',
    'to',
    'by',
    'of',
  ]);

  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split PascalCase & camelCase
    .replace(/[_-]/g, ' ') // Replace kebab-case and snake_case with spaces
    .replace(/(\d+)/g, ' $1 ') // Add spaces around numbers
    .replace(/\s+/g, ' ') // Remove extra spaces
    .trim()
    .split(' ')
    .map((word, index) => {
      // Preserve uppercase acronyms (e.g., API, HTTP)
      if (/^[A-Z]{2,}$/.test(word)) {
        return word;
      }

      // Capitalize first word or non-minor words
      if (index === 0 || !minorWords.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

/**
 * Converts a string to Sentence Case.
 * - Capitalizes only the first letter of the sentence.
 * - Retains case of proper nouns.
 *
 * @param input - The string to convert.
 * @returns The formatted sentence case string.
 */
export function toSentenceCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split PascalCase & camelCase
    .replace(/[_-]/g, ' ') // Replace kebab-case and snake_case with spaces
    .replace(/(\d+)/g, ' $1 ') // Add spaces around numbers
    .replace(/\s+/g, ' ') // Remove extra spaces
    .trim()
    .toLowerCase()
    .replace(/^(\w)/, match => match.toUpperCase()) // Capitalize first letter
    .replace(/\b([A-Z]{2,})\b/g, match => match); // Preserve uppercase acronyms
}
