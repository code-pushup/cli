import {describe, expect, it} from 'vitest';
import {getCompilerOptionsToDetermineListedAudits} from './utils.js';
import type {TypescriptPluginOptions} from "./types.js";
import * as utilsModule from "./utils.js";
import config544 from "./default-ts-configs/5.4.4.js";

describe('getCompilerOptions', () => {

  const getCurrentTsVersionSpy = vi.spyOn(utilsModule, 'getCurrentTsVersion');

  it('should return valid options', async () => {
    getCurrentTsVersionSpy.mockResolvedValue('5.4.4');
    const options: TypescriptPluginOptions = {
      tsConfigPath: 'packages/plugin-typescript/mocks/fixtures/compiler-defaults/tsconfig.json'
    };

    const definitive = await getCompilerOptionsToDetermineListedAudits(options);
    const {importsNotUsedAsValues, preserveValueImports, ...parsedOptions} = config544.compilerOptions;
    expect(definitive).toStrictEqual(expect.objectContaining({
      ...parsedOptions,
      isolatedDeclarations: true,
      noImplicitAny: true,
      module: "commonjs",
      rootDir: "./",
      strictBuiltinIteratorReturn: true,
      target: "es2016",
    }));
  });

  it('should respect short hand option strict', async () => {
    getCurrentTsVersionSpy.mockResolvedValue('5.4.4');
    const options: TypescriptPluginOptions = {
      tsConfigPath: 'packages/plugin-typescript/mocks/fixtures/compiler-defaults/tsconfig.json'
    };

    const definitive = await getCompilerOptionsToDetermineListedAudits(options);
    expect(definitive).toStrictEqual(expect.objectContaining({
      strict: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noImplicitAny: true,
      strictBuiltinIteratorReturn: true,
      strictPropertyInitialization: true,
      strictNullChecks: true,
      strictBindCallApply: true,
      strictFunctionTypes: true,
    }));
  });
});
