import { join } from 'path';
import * as process from 'process';
import { describe, expect } from 'vitest';
import { persistConfig, uploadConfig } from '@code-pushup/models/testing';
import { readCodePushupConfig } from './read-code-pushup-config';

describe('readCodePushupConfig', () => {
  it('should load file', async () => {
    const module = await readCodePushupConfig(
      join(process.cwd(), 'packages', 'core', 'test', 'minimal.config.mjs'),
    );
    expect(module).toEqual(
      expect.objectContaining({
        persist: expect.objectContaining(persistConfig()),
        upload: expect.objectContaining({
          ...uploadConfig(),
          organization: 'code-pushup',
        }),
        categories: expect.arrayContaining([
          expect.objectContaining({
            slug: 'category-slug-1',
          }),
        ]),
        plugins: expect.arrayContaining([
          expect.objectContaining({
            slug: 'mock-plugin-slug',
          }),
        ]),
      }),
    );
  });

  it('should throw if file does not exisit', async () => {
    const filepath = join('invalid-path', 'valid-export.mjs');
    await expect(readCodePushupConfig(filepath)).rejects.toThrow(
      `no such file or directory, stat '${filepath}'`,
    );
  });

  it('should throw if config is invalid', async () => {
    const filepath = join(
      process.cwd(),
      'packages',
      'core',
      'test',
      'invaid.config.mjs',
    );
    await expect(readCodePushupConfig(filepath)).rejects.toThrow(
      `"code": "invalid_type",`,
    );
  });
});
