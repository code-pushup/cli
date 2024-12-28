import type { CompilerOptions } from 'typescript';
import { describe, expect, it } from 'vitest';
import config554 from '../../mocks/fixtures/default-ts-configs/5.5.4.js';
import {
  handleCompilerOptionStrict,
  normalizeCompilerOptions,
} from './normalize-compiler-options.js';
import * as runnerUtilsModule from './runner/utils.js';

describe('handleCompilerOptionStrict', () => {
  it('should return original options when strict is false', () => {
    const options: CompilerOptions = {
      strict: false,
    };

    const result = handleCompilerOptionStrict(options);
    expect(result).toBe(options);
  });

  it('should add all strict options when strict is true', () => {
    const options: CompilerOptions = {
      strict: true,
    };

    const result = handleCompilerOptionStrict(options);

    expect(result).toStrictEqual({
      ...options,
      noImplicitAny: true,
      noImplicitThis: true,
      alwaysStrict: true,
      strictBuiltinIteratorReturn: true,
      strictPropertyInitialization: true,
      strictNullChecks: true,
      strictBindCallApply: true,
      strictFunctionTypes: true,
    });
  });

  it('should add all strict options when strict is true and override existing value', () => {
    const options: CompilerOptions = {
      strict: true,
      noImplicitAny: false,
    };

    const result = handleCompilerOptionStrict(options);

    expect(result.noImplicitAny).toBe(true);
  });

  it('should preserve existing option values while adding strict options', () => {
    const options: CompilerOptions = {
      strict: true,
      target: 2,
      verbatimModuleSyntax: false,
    };

    const result = handleCompilerOptionStrict(options);

    expect(result.strict).toBe(true);
    expect(result.target).toBe(2);
    expect(result.verbatimModuleSyntax).toBe(false);
  });
});

describe('normalizeCompilerOptions', () => {
  const loadTsConfigDefaultsByVersionSpy = vi
    .spyOn(runnerUtilsModule, 'loadTsConfigDefaultsByVersion')
    .mockResolvedValue(config554 as any);
  const loadTargetConfigSpy = vi
    .spyOn(runnerUtilsModule, 'loadTargetConfig')
    .mockResolvedValue({
      options: {
        verbatimModuleSyntax: false,
      },
      fileNames: [],
      errors: [],
    });

  it('should return default compiler options from provided file', async () => {
    await expect(
      normalizeCompilerOptions({ tsConfigPath: 'mocked/away/tsconfig.json' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        verbatimModuleSyntax: false,
        noImplicitAny: true,
      }),
    );

    expect(loadTsConfigDefaultsByVersionSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledWith(
      expect.stringContaining('mocked/away/tsconfig.json'),
    );
  });
});
