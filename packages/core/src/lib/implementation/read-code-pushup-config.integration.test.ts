import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect } from 'vitest';
import { readRcByPath } from './read-rc-file';

describe('readRcByPath', () => {
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

  it('should throw if the configuration is empty', async () => {
    await expect(
      readRcByPath(join(configDirPath, 'code-pushup.empty.config.js')),
    ).rejects.toThrow(`"code": "invalid_type",`);
  });

  it('should throw if the configuration is invalid', async () => {
    await expect(
      readRcByPath(join(configDirPath, 'code-pushup.invalid.config.ts')),
    ).rejects.toThrow(/refs are duplicates/);
  });
});
