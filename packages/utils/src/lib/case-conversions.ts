import type { CamelCaseToKebabCase, KebabCaseToCamelCase } from './types.js';

/**
 * Converts a kebab-case string to camelCase.
 * @param string - The kebab-case string to convert.
 * @returns The camelCase string.
 */
export function kebabCaseToCamelCase<T extends string>(
  string: T,
): KebabCaseToCamelCase<T> {
  return string
    .split('-')
    .map((segment, index) => (index === 0 ? segment : capitalize(segment)))
    .join('') as KebabCaseToCamelCase<T>;
}

/**
 * Converts a camelCase string to kebab-case.
 * @param input - The camelCase string to convert.
 * @returns The kebab-case string.
 */
export function camelCaseToKebabCase<T extends string>(
  input: T,
): CamelCaseToKebabCase<T> {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert dash before uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Handle consecutive uppercase letters
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
        return capitalize(word);
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

export function capitalize<T extends string>(text: T): Capitalize<T> {
  return `${text.charAt(0).toLocaleUpperCase()}${text.slice(1).toLowerCase()}` as Capitalize<T>;
}
