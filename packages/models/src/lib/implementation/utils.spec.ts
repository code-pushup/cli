import { describe, expect, it } from 'vitest';
import {
  generalFilePathRegex,
  hasDuplicateStrings,
  hasMissingStrings,
  slugRegex,
} from './utils';
import { join } from 'path';

describe('slugRegex', () => {
  // test valid and array of strings against slugRegex with it blocks
  it.each([
    'hello',
    'hello-world',
    'hello-123-world',
    '123',
    '123-456',
    '123-world-789',
  ])(`should match valid %p`, slug => {
    expect(slug).toMatch(slugRegex);
  });

  // test invalid and array of strings against slugRegex with it blocks
  it.each([
    '',
    ' ',
    'hello world',
    'hello_world',
    'hello-World',
    'hello-world-',
    '-hello-world',
    'hello--world',
    '123-',
    '-123',
    '123--456',
  ])(`should not match invalid slugs %p`, invalidSlugs => {
    expect(invalidSlugs).not.toMatch(slugRegex);
  });
});

// @TODO delete implementation and tests
describe('generalFilePathRegex', () => {
  // test valid and array of strings against slugRegex with it blocks
  const validPathsUnix = [
    '/home/user/documents/file.txt',
    '/var/www/html/index.html',
    'home/user/',
    'file.txt',
    '/a/b/c/d/e',
    'folder/file.ext',
    '/folder.with.dots/file',
  ];
  const validPathsWindows = [
    'C:\\Users\\John\\Documents\\file.docx',
    'D:/Games/Valheim/game.exe',
    'C:\\Program Files\\App\\binary.exe',
    'I:/path with spaces/',
    'E:/folder/file.ext',
    'F:\\a\\b\\c\\d.txt',
    'G:/folder.with.dots/file.exe',
  ];
  it.each(validPathsUnix.concat(validPathsWindows))(
    `should match valid filePath %p`,
    filePath => {
      expect(filePath).toMatch(generalFilePathRegex);
    },
  );

  const invalidPathsUnix = [
    '//home/user/',
    ' /leading-space/path',
    'home//user/',
    '/folder/../file',
    '/a/b/c//d',
    'folder/name?',
    '/folder<>/file',
    'folder*',
  ];
  const invalidPathsWindows = [
    'C::\\Users\\John',
    ' C:\\Leading-space',
    'D:/Games//Valheim/',
    'H:\\invalid|char/file.txt',
    'C:\\path<>\\file',
    'D:/question/file?.txt',
    'E:\\star/file*.txt',
  ];

  it.each(invalidPathsUnix.concat(invalidPathsWindows))(
    `should not match invalid filePath %p`,
    invalidFilePath => {
      expect(invalidFilePath).not.toMatch(generalFilePathRegex);
    },
  );
});

// @TODO delete implementation and tests
describe('unixFilePathRegex', () => {
  // test valid and array of strings against slugRegex with it blocks
  it.each([
    '/home/user/documents/file.txt',
    '/var/www/html/index.html',
    'home/user/',
    'file.txt',
    '/a/b/c/d/e',
    'folder/file.ext',
    '/folder.with.dots/file',
  ])(`should match valid filePath %p}`, validPaths => {
    expect(validPaths).toMatch(generalFilePathRegex);
  });

  it.each([
    '//home/user/',
    ' /leading-space/path',
    'home//user/',
    '/folder/../file',
    '/a/b/c//d',
    'folder/name?',
    '/folder<>/file',
    'folder*',
  ])(`should not match invalid filePath %p}`, validPaths => {
    expect(validPaths).not.toMatch(generalFilePathRegex);
  });
});

describe('stringUnique', () => {
  it('should return true for a list of unique strings', () => {
    expect(hasDuplicateStrings(['a', 'b'])).toBe(false);
  });
  it('should return a list of duplicated strings for a invalid list', () => {
    expect(hasDuplicateStrings(['a', 'b', 'a', 'c'])).toEqual(['a']);
  });
  it('should return a false for a list with 1 item', () => {
    expect(hasDuplicateStrings(['a'])).toBe(false);
  });
});

describe('stringsExist', () => {
  it('should return true for the strings exist in target array', () => {
    expect(hasMissingStrings(['a', 'b'], ['a', 'b'])).toBe(false);
  });
  it('should return a list of strings from source that are missing in target', () => {
    expect(hasMissingStrings(['a', 'b'], ['a', 'c'])).toEqual(['b']);
  });
});
