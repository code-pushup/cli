import { describe, expect } from 'vitest';
import { getTsConfigurationFromPath } from './typescript-runner.js';

describe('getTsConfigurationFromPath', () => {
  it('should accept valid options', async () => {
    await expect(
      getTsConfigurationFromPath({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
      }),
    ).resolves.toStrictEqual({
      compilerOptions: {
        configFilePath: undefined,
        module: 1,
        rootDir: expect.any(String),
        strict: true,
        target: 2,
      },
      fileNames: expect.arrayContaining([
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
      ]),
    });
  });
});
