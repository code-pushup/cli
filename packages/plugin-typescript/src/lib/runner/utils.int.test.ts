import * as tsModule from 'typescript';
import { describe, expect, vi } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import { loadTargetConfig } from './utils.js';

describe('loadTargetConfig', () => {
  const readConfigFileSpy = vi.spyOn(tsModule, 'readConfigFile');
  const parseJsonConfigFileContentSpy = vi.spyOn(
    tsModule,
    'parseJsonConfigFileContent',
  );

  it('should return the parsed content of a tsconfig file and ist TypeScript helper to parse it', () => {
    expect(
      loadTargetConfig(
        osAgnosticPath(
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.init.json',
        ),
      ),
    ).toStrictEqual(
      expect.objectContaining({
        fileNames: expect.any(Array),
        options: {
          module: 1,
          configFilePath: expect.stringContaining('tsconfig.init.json'),
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          skipLibCheck: true,
          strict: true,
          target: 3,
        },
      }),
    );
    expect(readConfigFileSpy).toHaveBeenCalledTimes(1);
    expect(readConfigFileSpy).toHaveBeenCalledWith(
      expect.stringContaining('tsconfig.init.json'),
      expect.any(Function),
    );
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledTimes(1);
  });

  it('should return the parsed content of a tsconfig file that extends another config', () => {
    expect(
      loadTargetConfig(
        'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.extends-extending.json',
      ),
    ).toStrictEqual(
      expect.objectContaining({
        fileNames: expect.arrayContaining([
          // from tsconfig.extends-base.json#includes and tsconfig.extends-extending.json#excludes
          expect.stringMatching(/src[/\\]0-no-diagnostics[/\\]/),
        ]),
        options: expect.objectContaining({
          // Options from tsconfig.extends-base.json
          rootDir: expect.stringMatching(/basic-setup$/),
          // Options from tsconfig.extends-extending.json
          module: 1,
          configFilePath: expect.stringContaining(
            'tsconfig.extends-extending.json',
          ),
          verbatimModuleSyntax: true, // Overrides base config's false
        }),
      }),
    );

    expect(readConfigFileSpy).toHaveBeenCalledTimes(1);
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledTimes(1);
  });
});
