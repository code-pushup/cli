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
 * Formats a string to a readable title.
 * @param stringToFormat - The string to format.
 * @returns The formatted title.
 */
export function kebabCaseToSentence(stringToFormat: string) {
  return stringToFormat
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

/**
 * Converts a camelCase, PascalCase, kebab-case, or snake_case string into a readable sentence.
 * It also ensures numbers are separated correctly from words.
 *
 * @example
 * camelCaseToSentence('helloWorld') // 'Hello world'
 * camelCaseToSentence('thisIsALongString') // 'This is a long string'
 * camelCaseToSentence('my-1-word') // 'My 1 word'
 * camelCaseToSentence('my_snake_case') // 'My snake case'
 * camelCaseToSentence('PascalCaseExample') // 'Pascal case example'
 * camelCaseToSentence('Chapter1Introduction') // 'Chapter 1 Introduction'
 *
 * @param stringToFormat - The string to format.
 * @returns The formatted title.
 */
export function formatToSentenceCase(stringToFormat: string): string {
  return stringToFormat
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> split before uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // PascalCase -> split uppercase sequences
    .replace(/(\d+)([A-Za-z])/g, '$1 $2') // Separate numbers from letters (before a letter)
    .replace(/([A-Za-z])(\d+)/g, '$1 $2') // Separate numbers from letters (after a letter)
    .replace(/[-_]+/g, ' ') // Convert kebab-case and snake_case to spaces
    .trim() // Remove leading/trailing spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter
}
