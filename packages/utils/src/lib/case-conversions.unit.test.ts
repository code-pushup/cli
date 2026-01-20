import {
  camelCaseToKebabCase,
  capitalize,
  kebabCaseToCamelCase,
  lowercase,
  toSentenceCase,
  toTitleCase,
  uppercase,
} from './case-conversions.js';

describe('capitalize', () => {
  it('should transform the first string letter to upper case', () => {
    expect(capitalize('code')).toBe('Code');
  });

  it('should lowercase all but the the first string letter', () => {
    expect(capitalize('PushUp')).toBe('Pushup');
  });

  it('should leave the first string letter in upper case', () => {
    expect(capitalize('Code')).toBe('Code');
  });

  it('should accept empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('lowercase', () => {
  it('should convert string to lower case', () => {
    expect(lowercase('Warning')).toBe('warning');
  });
});

describe('uppercase', () => {
  it('should convert string to upper case', () => {
    expect(uppercase('Warning')).toBe('WARNING');
  });
});

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
  it('should convert camelCase to kebab-case', () => {
    expect(camelCaseToKebabCase('myTestString')).toBe('my-test-string');
  });

  it('should handle acronyms properly', () => {
    expect(camelCaseToKebabCase('APIResponse')).toBe('api-response');
  });

  it('should handle consecutive uppercase letters correctly', () => {
    expect(camelCaseToKebabCase('myXMLParser')).toBe('my-xml-parser');
  });

  it('should handle single-word camelCase', () => {
    expect(camelCaseToKebabCase('singleWord')).toBe('single-word');
  });

  it('should not modify already kebab-case strings', () => {
    expect(camelCaseToKebabCase('already-kebab')).toBe('already-kebab');
  });

  it('should not modify non-camelCase inputs', () => {
    expect(camelCaseToKebabCase('not_camelCase')).toBe('not_camel-case');
  });
});

describe('toTitleCase', () => {
  it('should capitalize each word in a simple sentence', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
  });

  it('should capitalize each word in a longer sentence', () => {
    expect(toTitleCase('this is a title')).toBe('This Is a Title');
  });

  it('should convert PascalCase to title case', () => {
    expect(toTitleCase('FormatToTitleCase')).toBe('Format to Title Case');
  });

  it('should convert camelCase to title case', () => {
    expect(toTitleCase('thisIsTest')).toBe('This Is Test');
  });

  it('should convert kebab-case to title case', () => {
    expect(toTitleCase('hello-world-example')).toBe('Hello World Example');
  });

  it('should convert snake_case to title case', () => {
    expect(toTitleCase('snake_case_example')).toBe('Snake Case Example');
  });

  it('should capitalize a single word', () => {
    expect(toTitleCase('hello')).toBe('Hello');
  });

  it('should handle numbers in words correctly', () => {
    expect(toTitleCase('chapter1Introduction')).toBe('Chapter 1 Introduction');
  });

  it('should handle numbers in slugs correctly', () => {
    expect(toTitleCase('version2Release')).toBe('Version 2 Release');
  });

  it('should handle acronyms properly', () => {
    expect(toTitleCase('apiResponse')).toBe('Api Response');
  });

  it('should handle mixed-case inputs correctly', () => {
    expect(toTitleCase('thisIs-mixed_CASE')).toBe('This Is Mixed CASE');
  });

  it('should not modify already formatted title case text', () => {
    expect(toTitleCase('Hello World')).toBe('Hello World');
  });

  it('should return an empty string when given an empty input', () => {
    expect(toTitleCase('')).toBe('');
  });
});

describe('toSentenceCase', () => {
  it('should convert a simple sentence to sentence case', () => {
    expect(toSentenceCase('hello world')).toBe('Hello world');
  });

  it('should maintain a correctly formatted sentence', () => {
    expect(toSentenceCase('This is a test')).toBe('This is a test');
  });

  it('should convert PascalCase to sentence case', () => {
    expect(toSentenceCase('FormatToSentenceCase')).toBe(
      'Format to sentence case',
    );
  });

  it('should convert camelCase to sentence case', () => {
    expect(toSentenceCase('thisIsTest')).toBe('This is test');
  });

  it('should convert kebab-case to sentence case', () => {
    expect(toSentenceCase('hello-world-example')).toBe('Hello world example');
  });

  it('should convert snake_case to sentence case', () => {
    expect(toSentenceCase('snake_case_example')).toBe('Snake case example');
  });

  it('should capitalize a single word', () => {
    expect(toSentenceCase('hello')).toBe('Hello');
  });

  it('should handle numbers in words correctly', () => {
    expect(toSentenceCase('chapter1Introduction')).toBe(
      'Chapter 1 introduction',
    );
  });

  it('should handle numbers in slugs correctly', () => {
    expect(toSentenceCase('version2Release')).toBe('Version 2 release');
  });

  it('should handle acronyms properly', () => {
    expect(toSentenceCase('apiResponse')).toBe('Api response');
  });

  it('should handle mixed-case inputs correctly', () => {
    expect(toSentenceCase('thisIs-mixed_CASE')).toBe('This is mixed case');
  });

  it('should not modify already formatted sentence case text', () => {
    expect(toSentenceCase('This is a normal sentence.')).toBe(
      'This is a normal sentence.',
    );
  });

  it('should return an empty string when given an empty input', () => {
    expect(toSentenceCase('')).toBe('');
  });
});
