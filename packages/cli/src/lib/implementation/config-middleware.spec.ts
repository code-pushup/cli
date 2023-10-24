import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'vitest';
import { configMiddleware } from './config-middleware';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withDirName = (path: string) => join(__dirname, path);
const config = (ext: string) =>
  `${withDirName(
    join(
      '..',
      '..',
      '..',
      '..',
      'models',
      'test',
      'fixtures',
      'code-pushup.config.mock.',
    ),
  )}${ext}`;

describe('applyConfigMiddleware', () => {
  it('should load valid .mjs config', async () => {
    const configPathMjs = config('mjs');
    const _config = await configMiddleware({ config: configPathMjs });
    expect(_config.upload?.project).toContain('mjs');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .cjs config', async () => {
    const configPathCjs = config('cjs');
    const _config = await configMiddleware({ config: configPathCjs });
    expect(_config.upload?.project).toContain('cjs');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .js config', async () => {
    const configPathJs = config('js');
    const _config = await configMiddleware({ config: configPathJs });
    expect(_config.upload?.project).toContain('js');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should throw with invalid config', async () => {
    const invalidConfig = 'wrong/path/to/config';
    let error: Error = new Error();
    await configMiddleware({ config: invalidConfig }).catch(e => (error = e));
    expect(error?.message).toContain(invalidConfig);
  });

  it('should provide default config', async () => {
    const defaultConfigPath = 'code-pushup.config.js';
    let error: Error = new Error();
    await configMiddleware({ config: defaultConfigPath }).catch(
      e => (error = e),
    );
    expect(error?.message).toContain(defaultConfigPath);
  });
});
