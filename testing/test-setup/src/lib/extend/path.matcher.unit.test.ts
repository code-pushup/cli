import { describe, expect, it, vi } from 'vitest';
import * as testUtils from '@code-pushup/test-utils';

describe('path-matcher', () => {
  const osAgnosticPathSpy = vi.spyOn(testUtils, 'osAgnosticPath');

  it('should provide "toMatchPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to/file.txt';

    expect(actual).toMatchPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToMatch" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to/file.txt';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToMatch(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "toStartWithPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to';

    expect(actual).toStartWithPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToStartWith" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToStartWith(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "toContainPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to';

    expect(actual).toContainPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToContain" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToContain(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "toEndWithPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to/file.txt';

    expect(actual).toEndWithPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToEndWith" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to/file.txt';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToEndWith(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });
});
