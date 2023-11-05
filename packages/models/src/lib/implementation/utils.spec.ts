import { describe, expect, it } from 'vitest';
import {
  REPORT_NAME_PATTERN,
  filenameRegex,
  hasDuplicateStrings,
  hasMissingStrings,
  reportFileName,
  slugRegex,
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

describe('filenameRegex', () => {
  // test valid and array of strings against filenameRegex with it blocks
  it.each(['report', 'report.mock', 'report-test.mock'])(
    `should match valid %p`,
    filename => {
      expect(filename).toMatch(filenameRegex);
    },
  );

  // test invalid and array of strings against filenameRegex with it blocks
  it.each([
    '',
    ' ',
    'file/name',
    'file:name',
    'file*name',
    'file?name',
    'file"name',
    'file<name',
    'file>name',
    'file|name',
  ])(`should not match invalid file name %p`, invalidFilename => {
    expect(invalidFilename).not.toMatch(filenameRegex);
  });
});

describe('reportNameFromReport', () => {
  it('should create a file name that is in sync with the REPORT_NAME_PATTERN', () => {
    expect(reportFileName({ date: new Date().toISOString() })).toMatch(
      REPORT_NAME_PATTERN,
    );
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
