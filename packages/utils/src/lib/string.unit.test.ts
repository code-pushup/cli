import {
  camelCaseToKebabCase,
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
  it('should convert simple slug to title case', () => {
    expect(kebabCaseToSentence('hello-world')).toBe('Hello World');
  });

  it('should handle multiple hyphens', () => {
    expect(kebabCaseToSentence('this-is-a-title')).toBe('This Is A Title');
  });

  it('should handle empty string', () => {
    expect(kebabCaseToSentence()).toBe('');
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
