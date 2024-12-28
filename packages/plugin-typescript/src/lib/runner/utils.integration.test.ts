import {describe, expect} from 'vitest';
import packageJson from 'node_modules/typescript/package.json' assert {type: 'json'};
import {getCurrentTsVersion, loadTargetConfig} from "./utils.js";
import * as tsModule from "typescript";

describe('getCurrentTsVersion', () => {
  it('should return currently installed TypeScript version as semver string', async () => {
    await expect(getCurrentTsVersion()).resolves.toMatch(packageJson.version);
  });
});

describe('loadTargetConfig', () => {
  const parseConfigFileTextToJsonSpy = vi.spyOn(tsModule, 'parseConfigFileTextToJson');
  const parseJsonConfigFileContentSpy = vi.spyOn(tsModule, 'parseJsonConfigFileContent');

  it('should return the parsed content of a tsconfig file and ist TypeScript helper to parse it', async () => {
    await expect(loadTargetConfig('packages/plugin-typescript/mocks/fixtures/tsconfig.init.json')).resolves
      .toStrictEqual(expect.objectContaining({
          fileNames: expect.any(Array),
          options: {
            module: 1,
            configFilePath: undefined,
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: true,
            strict: true,
            target: 3
          }
        })
      );
    expect(parseConfigFileTextToJsonSpy).toHaveBeenCalledTimes(1);
    expect(parseConfigFileTextToJsonSpy).toHaveBeenCalledWith("packages/plugin-typescript/mocks/fixtures/tsconfig.init.json", expect.stringContaining('/* Projects */'));
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledTimes(1);
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledWith(expect.objectContaining({
      compilerOptions: expect.objectContaining({
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        module: "commonjs",
        skipLibCheck: true,
        strict: true,
        target: "es2016",
      })
    }), expect.any(Object), expect.any(String));
  });

});
