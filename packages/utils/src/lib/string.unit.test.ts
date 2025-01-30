import {
  camelCaseToKebabCase,
  formatToSentenceCase,
  kebabCaseToCamelCase,
  kebabCaseToSentence,
} from './string.js';

describe('kebabCaseToCamelCase', () => {
  it('should convert simple kebab-case to camelCase', () => {
    expect(kebabCaseToCamelCase('hello-world')).toBe('helloWorld');
  });

  it('should handle multiple hyphens', () => {
    expect(kebabCaseToCamelCase('this-is-a-long-string')).toBe(
      'thisIsALongString',
    );
  });

  it('should preserve numbers', () => {
    expect(kebabCaseToCamelCase('user-123-test')).toBe('user123Test');
  });

  it('should handle single word', () => {
    expect(kebabCaseToCamelCase('hello')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(kebabCaseToCamelCase('')).toBe('');
  });
});

describe('camelCaseToKebabCase', () => {
  it('should convert simple camelCase to kebab-case', () => {
    expect(camelCaseToKebabCase('helloWorld')).toBe('hello-world');
  });

  it('should handle multiple capital letters', () => {
    expect(camelCaseToKebabCase('thisIsALongString')).toBe(
      'this-is-a-long-string',
    );
  });

  it('should handle consecutive capital letters', () => {
    expect(camelCaseToKebabCase('myXMLParser')).toBe('my-xml-parser');
  });

  it('should handle spaces and underscores', () => {
    expect(camelCaseToKebabCase('hello_world test')).toBe('hello-world-test');
  });

  it('should handle single word', () => {
    expect(camelCaseToKebabCase('hello')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(camelCaseToKebabCase('')).toBe('');
  });
});

describe('kebabCaseToSentence', () => {
  it('should convert simple kebab-case string to title case', () => {
    expect(kebabCaseToSentence('hello-world')).toBe('Hello World');
  });

  it('should handle multiple hyphens', () => {
    expect(kebabCaseToSentence('this-is-a-title')).toBe('This Is A Title');
  });

  it('should handle single word', () => {
    expect(kebabCaseToSentence('hello')).toBe('Hello');
  });

  it('should handle numbers in slug', () => {
    expect(kebabCaseToSentence('chapter-1-introduction')).toBe(
      'Chapter 1 Introduction',
    );
  });
});

describe('formatToSentenceCase', () => {
  it('should convert camelCase to sentence case', () => {
    expect(formatToSentenceCase('helloWorld')).toBe('Hello World');
    expect(formatToSentenceCase('thisIsATitle')).toBe('This Is A Title');
    expect(formatToSentenceCase('myTestString')).toBe('My Test String');
  });

  it('should convert PascalCase to sentence case', () => {
    expect(formatToSentenceCase('HelloWorld')).toBe('Hello World');
    expect(formatToSentenceCase('FormatToSentenceCase')).toBe(
      'Format To Sentence Case',
    );
  });

  it('should handle strings with numbers correctly', () => {
    expect(formatToSentenceCase('chapter1Introduction')).toBe(
      'Chapter 1 Introduction',
    );
    expect(formatToSentenceCase('version2Release')).toBe('Version 2 Release');
    expect(formatToSentenceCase('test123String')).toBe('Test 123 String');
  });

  it('should handle kebab-case and snake_case formats', () => {
    expect(formatToSentenceCase('hello-world')).toBe('Hello World');
    expect(formatToSentenceCase('snake_case_example')).toBe(
      'Snake Case Example',
    );
  });

  it('should return capitalized single words', () => {
    expect(formatToSentenceCase('hello')).toBe('Hello');
    expect(formatToSentenceCase('test')).toBe('Test');
  });

  it('should handle acronyms properly', () => {
    expect(formatToSentenceCase('APIResponse')).toBe('API Response');
    expect(formatToSentenceCase('HTTPError')).toBe('HTTP Error');
  });

  it('should handle mixed case formats', () => {
    expect(formatToSentenceCase('thisIs-mixed_CASE')).toBe(
      'This Is Mixed CASE',
    );
  });

  it('should return an empty string when given an empty input', () => {
    expect(formatToSentenceCase('')).toBe('');
  });

  it('should not modify already formatted sentences', () => {
    expect(formatToSentenceCase('This is a sentence')).toBe(
      'This Is A Sentence',
    );
    expect(formatToSentenceCase('Hello World')).toBe('Hello World');
  });
});
