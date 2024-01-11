import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { readCodePushupConfig } from './read-code-pushup-config';

describe('readCodePushupConfig', () => {
  const configDirPath = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    '..',
    'testing-utils',
    'src',
    'lib',
    'fixtures',
    'configs',
  );

  it('should load a valid configuration file', async () => {
    await expect(
      readCodePushupConfig(join(configDirPath, 'code-pushup.config.ts')),
    ).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({
          organization: 'code-pushup',
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

  it('should throw if the file does not exist', async () => {
    await expect(
      readCodePushupConfig(join('non-existent', 'config.file.js')),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });

  it('should throw if the configuration is empty', async () => {
    await expect(
      readCodePushupConfig(join(configDirPath, 'code-pushup.empty.config.js')),
    ).rejects.toThrow(`"code": "invalid_type",`);
  });

  it('should throw if the configuration is invalid', async () => {
    await expect(
      readCodePushupConfig(
        join(configDirPath, 'code-pushup.invalid.config.ts'),
      ),
    ).rejects.toThrow(/refs are duplicates/);
  });
});
