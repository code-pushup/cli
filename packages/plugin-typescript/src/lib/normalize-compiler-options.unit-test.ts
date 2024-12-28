import type {CompilerOptions} from 'typescript';
import {describe, expect, it} from 'vitest';
import {handleCompilerOptionStrict, normalizeCompilerOptions} from "./normalize-compiler-options.js";

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
  it.todo('should return default compiler options from provided file', async () => {
    expect(await normalizeCompilerOptions({tsConfigPath: ''})).toStrictEqual({}) ;
  })
})
