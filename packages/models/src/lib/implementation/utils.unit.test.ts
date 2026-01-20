import {
  filenameRegex,
  hasDuplicateStrings,
  hasMissingStrings,
  slugRegex,
} from './utils.js';

describe('slugRegex', () => {
  it.each([
    'hello',
    'hello-world',
    'hello-123-world',
    '123',
    '123-456',
    '123-world-789',
  ])(`should match a valid slug %p`, slug => {
    expect(slug).toMatch(slugRegex);
  });

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
  ])(`should not match an invalid slug %p`, invalidSlug => {
    expect(invalidSlug).not.toMatch(slugRegex);
  });
});

describe('filenameRegex', () => {
  it.each(['report', 'report.mock', 'report-test.mock'])(
    `should match a valid file name %p`,
    filename => {
      expect(filename).toMatch(filenameRegex);
    },
  );

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
  ])(`should not match an invalid file name %p`, invalidFilename => {
    expect(invalidFilename).not.toMatch(filenameRegex);
  });
});

describe('hasDuplicateStrings', () => {
  it('should return false for a list of unique strings', () => {
    expect(hasDuplicateStrings(['a', 'b'])).toBeFalse();
  });

  it('should return a list of duplicates for a list with duplicates', () => {
    expect(hasDuplicateStrings(['a', 'b', 'a', 'c'])).toEqual(['a']);
  });

  it('should return a duplicate only once', () => {
    expect(hasDuplicateStrings(['a', 'b', 'a', 'a'])).toEqual(['a']);
  });

  it('should return false for a list with 1 item', () => {
    expect(hasDuplicateStrings(['a'])).toBeFalse();
  });
});

describe('hasMissingStrings', () => {
  it('should return false for two identical arrays', () => {
    expect(hasMissingStrings(['a', 'b'], ['a', 'b'])).toBeFalse();
  });

  it('should return false for an array subset', () => {
    expect(hasMissingStrings(['b'], ['a', 'b'])).toBeFalse();
  });

  it('should return false for two empty arrays', () => {
    expect(hasMissingStrings([], [])).toBeFalse();
  });

  it('should return a list of strings from source that are missing in target', () => {
    expect(hasMissingStrings(['a', 'b'], ['a', 'c'])).toEqual(['b']);
  });
});
