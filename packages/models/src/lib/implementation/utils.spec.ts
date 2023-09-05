import { describe, expect, it } from 'vitest';

import {
  generalFilePathRegex,
  refRegex,
  slugRegex,
  stringsExist,
  stringsUnique,
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
  ])('should match valid %p`, (slug) => {
    expect(slug).toMatch(slugRegex);
  });

  // test invalid and array of strings against slugRegex with it blocks
  const invalidSlugs = [
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
  ];

  for (let i = 0; i < invalidSlugs.length; i++) {
    it(`should not match invalid slugs ${invalidSlugs[i]}`, () => {
      const invalidSlug = invalidSlugs[i];
      expect(slugRegex.test(invalidSlug)).toBe(false);
    });
  }
});

describe('refRegex', () => {
  // test valid and array of strings against refRegex with it blocks
  const refs = [
    'hello#world',
    'hello-the#world',
    '123-the#world-there',
    // groups
    'hello:123#world',
    'hello:123#world-there',
  ];
  for (let i = 0; i < refs.length; i++) {
    it(`should match valid ref ${refs[i]}`, () => {
      const ref = refs[i];
      expect(refRegex.test(ref)).toBe(true);
    });
  }

  // test invalid and array of strings against refRegex with it blocks
  const invalidRefs = [
    '',
    ' ',
    'hello #world',
    '123#world there',
    'hello.123#world',
    'the-hello:123#world there',
  ];

  for (let i = 0; i < invalidRefs.length; i++) {
    it(`should not match invalid ref ${invalidRefs[i]}`, () => {
      const invalidRef = invalidRefs[i];
      expect(refRegex.test(invalidRef)).toBe(false);
    });
  }
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
  const filePaths = validPathsUnix.concat(validPathsWindows);

  for (let i = 0; i < filePaths.length; i++) {
    it(`should match valid filePath ${filePaths[i]}`, () => {
      const filePath = filePaths[i];
      expect(generalFilePathRegex.test(filePath)).toBe(true);
    });
  }

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

  const invalidFilePaths = invalidPathsUnix.concat(invalidPathsWindows);

  for (let i = 0; i < invalidFilePaths.length; i++) {
    it(`should not match invalid filePath ${invalidFilePaths[i]}`, () => {
      const invalidFilePath = invalidFilePaths[i];
      expect(generalFilePathRegex.test(invalidFilePath)).toBe(false);
    });
  }
});

describe('unixFilePathRegex', () => {
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

  for (let i = 0; i < validPathsUnix.length; i++) {
    it(`should match valid filePath ${validPathsUnix[i]}`, () => {
      const filePath = validPathsUnix[i];
      expect(generalFilePathRegex.test(filePath)).toBe(true);
    });
  }

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

  for (let i = 0; i < invalidPathsUnix.length; i++) {
    it(`should not match invalid filePath ${invalidPathsUnix[i]}`, () => {
      const invalidFilePath = invalidPathsUnix[i];
      expect(generalFilePathRegex.test(invalidFilePath)).toBe(false);
    });
  }
});

describe('stringUnique', () => {
  it('should return true for a list of unique strings', () => {
    expect(stringsUnique(['a', 'b'])).toBe(true);
  });
  it('should return a list of duplicated strings for a invalid list', () => {
    expect(stringsUnique(['a', 'b', 'a', 'c'])).toEqual(['a']);
  });
});

describe('stringsExist', () => {
  it('should return true for the strings exist in target array', () => {
    expect(stringsExist(['a', 'b'], ['a', 'b'])).toBe(true);
  });
  it('should return a list of strings from source that are missing in target', () => {
    expect(stringsExist(['a', 'b'], ['a', 'c'])).toEqual(['b']);
  });
});
