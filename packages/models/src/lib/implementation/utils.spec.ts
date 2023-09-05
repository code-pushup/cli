import { describe, expect, it } from 'vitest';

import {
  generalFilePathRegex,
  refRegex,
  slugRegex,
  hasMissingStrings,
  hasDuplicateStrings,
  refOrGroupRegex,
} from './utils';

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

describe('refRegex', () => {
  // test valid and array of strings against refRegex with it blocks
  it.each([
    'pluginslug#auditslug',
    'plugin-slug#auditslug',
    '123-plugin#audit-slug-123',
  ])(`should match valid ref %p`, ref => {
    expect(ref).toMatch(refRegex);
  });

  // test invalid and array of strings against refRegex with it blocks
  it.each([
    '',
    ' ',
    'pluginslug #auditslug',
    '123#audit slug',
    'pluginslug.123#auditslug',
    'plugin-slug:123#audit slug',
    // groups
    'plugin-slug#:group#audit-slug',
    '123-plugin-slug#audit:slug-123',
    '123-plugin-slug#group:audit:slug-123',
  ])(`should not match invalid ref %p`, ref => {
    expect(ref).not.toMatch(refRegex);
  });
});

describe('refOrGroupRegex', () => {
  // test valid and array of strings against refRegex with it blocks
  it.each([
    'pluginslug#auditslug',
    'plugin-slug#auditslug',
    '123-plugin#audit-slug-123',
    // groups
    'plugin-slug#group:audit-slug',
    '123-plugin-slug#group:audit-slug-123',
  ])(`should match valid ref %p`, ref => {
    expect(ref).toMatch(refOrGroupRegex);
  });

  // test invalid and array of strings against refRegex with it blocks
  it.each([
    '',
    ' ',
    'hello #world',
    '123#world there',
    'hello.123#world',
    'the-hello:123#world there',
  ])(`should not match invalid ref %p`, ref => {
    expect(ref).not.toMatch(refOrGroupRegex);
  });
});

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
    expect(hasDuplicateStrings(['a', 'b'])).toBe(true);
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
    expect(hasMissingStrings(['a', 'b'], ['a', 'b'])).toBe(true);
  });
  it('should return a list of strings from source that are missing in target', () => {
    expect(hasMissingStrings(['a', 'b'], ['a', 'c'])).toEqual(['b']);
  });
});
