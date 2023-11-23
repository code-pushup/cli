import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { configMiddleware } from './config-middleware';

describe('configMiddleware', () => {
  const configPath = join(
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

  it('should load valid .ts config', async () => {
    const config = await configMiddleware({
      config: join(configPath, 'code-pushup.config.ts'),
    });
    expect(config.config).toContain('code-pushup.config.ts');
    expect(config.upload?.project).toContain('ts');
  });

  it('should load valid .mjs config', async () => {
    const config = await configMiddleware({
      config: join(configPath, 'code-pushup.config.mjs'),
    });
    expect(config.config).toContain('code-pushup.config.mjs');
    expect(config.upload?.project).toContain('mjs');
  });

  it('should load valid .js config', async () => {
    const config = await configMiddleware({
      config: join(configPath, 'code-pushup.config.js'),
    });
    expect(config.config).toContain('code-pushup.config.js');
    expect(config.upload?.project).toContain('js');
  });

  it('should throw with invalid config path', async () => {
    await expect(
      configMiddleware({ config: 'wrong/path/to/config' }),
    ).rejects.toThrow(/no such file or directory/);
  });
});
