import {describe, expect, vi, it, beforeEach} from 'vitest';
import * as hasher from 'nx/src/hasher/file-hasher';
import {cacheKey, getCacheRecord, setCacheRecord} from "./caching";
import * as nxDevKit from "@nx/devkit";
import {vol} from "memfs";

describe('cacheKey', () => {
  let hashObjectSpy;

  beforeEach(() => {
    hashObjectSpy = vi.spyOn(hasher, 'hashObject').mockImplementation(() => '42');
  });

  afterEach(() => {
    hashObjectSpy.mockClear();
  });

  it('should start with provided prefix', () => {
    expect(cacheKey('verdaccio', {} as Record<string, unknown>)).toMatch(
      /^verdaccio-/
    );
  });

  it('should use hashObject to generate hash', () => {
    expect(cacheKey('x', {prop: 42} as Record<string, unknown>)).toMatch(
      /[0-9]*$/
    );
    expect(hashObjectSpy).toHaveBeenCalledTimes(1);
    expect(hashObjectSpy).toHaveBeenCalledWith({prop: 42});
  });

  it('should generate correct hash for empty object', () => {
    expect(cacheKey('x', {prop: 42} as Record<string, unknown>)).toBe('x-42');
    expect(hashObjectSpy).toHaveBeenCalledTimes(1);
    expect(hashObjectSpy).toHaveBeenCalledWith({prop: 42});
  });
});

describe('getCacheRecord', () => {
  let hashObjectSpy;

  beforeEach(() => {
    hashObjectSpy = vi.spyOn(hasher, 'hashObject').mockImplementation(() => '42');
  });

  afterEach(() => {
    hashObjectSpy.mockClear();
  });


  it('should get cached data if given', () => {
    const prefix = 'verdaccio';
    const targetsCache = {
      'verdaccio-42': 'cacheData',
    };
    const hashData = {prop: 42};

    expect(getCacheRecord(targetsCache, prefix, hashData)).toBe('cacheData');
  });

  it('should return undefined if no cache hit', () => {
    const targetsCache = {};
    const prefix = 'verdaccio';
    const hashData = {prop: 43};
    expect(getCacheRecord(targetsCache, prefix, hashData)).toBe(undefined);
  });

  it('should call cacheKey and hashObject', () => {
    const targetsCache = {
      'verdaccio-42': 'cacheData',
    };
    const prefix = 'verdaccio';
    const hashData = {prop: 42};
    const hashObjectSpy = vi.spyOn(hasher, 'hashObject');
    getCacheRecord(targetsCache, prefix, hashData);
    expect(hashObjectSpy).toHaveBeenCalledTimes(1);
    expect(hashObjectSpy).toHaveBeenCalledWith({prop: 42});
  });

})

describe('setCacheRecord', () => {
  let hashObjectSpy;

  beforeEach(() => {
    hashObjectSpy = vi.spyOn(hasher, 'hashObject').mockImplementation(() => '42');
  });

  afterEach(() => {
    hashObjectSpy.mockClear();
  });


  it('should set cached data if given', () => {
    const prefix = 'verdaccio';
    const targetsCache = {};
    const hashData = {prop: 42};
    expect(getCacheRecord(targetsCache,prefix, hashData)).toStrictEqual(undefined);
    expect(setCacheRecord(targetsCache, prefix, hashData, {test: 41})).not.toThrowError();
    expect(getCacheRecord(targetsCache,prefix, hashData)).toStrictEqual({test: 41});
  });

  it('should return cached data after setting', () => {
    const prefix = 'verdaccio';
    const targetsCache = {};
    const hashData = {prop: 42};

    expect(setCacheRecord(targetsCache, prefix, hashData, {test: 41})).toStrictEqual({test: 41});
  });

})

/**
 *
 * export function readTargetsCache(
 *   cachePath: string
 * ): Record<string, Partial<ProjectConfiguration>> {
 *   return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && existsSync(cachePath)
 *     ? readJsonFile(cachePath)
 *     : {};
 * }
 */
describe('readTargetsCache', () => {
  let readJsonFileSpy = vi.spyOn(nxDevKit, 'readJsonFile');

  beforeEach(() => {
    readJsonFileSpy = readJsonFileSpy.mockImplementation(() => ({
      vol.
    }));
  });

  afterEach(() => {
    readJsonFileSpy.mockRestore();
  });


  it('should read Targetfile', () => {

  });

})
