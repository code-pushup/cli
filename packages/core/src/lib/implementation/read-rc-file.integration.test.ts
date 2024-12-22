import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { ConfigValidationError, readRcByPath } from './read-rc-file.js';

describe('readRcByPath', () => {
  const configDirPath = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    '..',
    'testing',
    'test-utils',
    'src',
    'lib',
    'fixtures',
    'configs',
  );

  it('should load the configuration', async () => {
    await expect(
      readRcByPath(path.join(configDirPath, 'code-pushup.config.js')),
    ).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({
          project: 'cli-js',
        }),
        categories: expect.any(Array),
        plugins: expect.arrayContaining([
          expect.objectContaining({
            slug: 'node',
          }),
        ]),
      }),
    );
  });

  it('should load the configuration using provided tsconfig', async () => {
    await expect(
      readRcByPath(
        path.join(configDirPath, 'code-pushup.needs-tsconfig.config.ts'),
        path.join(configDirPath, 'tsconfig.json'),
      ),
    ).resolves.toEqual({
      plugins: [
        expect.objectContaining({
          slug: 'good-feels',
          audits: [{ slug: 'always-perfect', title: 'Always perfect' }],
          runner: expect.any(Function),
        }),
      ],
    });
  });

  it('should throw if the path is empty', async () => {
    await expect(readRcByPath('')).rejects.toThrow(
      'The path to the configuration file is empty.',
    );
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readRcByPath(path.join('non-existent', 'config.file.js')),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });

  it('should throw if the configuration is empty', async () => {
    await expect(
      readRcByPath(path.join(configDirPath, 'code-pushup.empty.config.js')),
    ).rejects.toThrow(expect.any(ConfigValidationError));
  });

  it('should throw if the configuration is invalid', async () => {
    await expect(
      readRcByPath(path.join(configDirPath, 'code-pushup.invalid.config.ts')),
    ).rejects.toThrow(/refs are duplicates/);
  });
});
