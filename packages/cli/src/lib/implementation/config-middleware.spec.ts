import { join } from 'path';
import { expect } from 'vitest';
import { toUnixPath } from '@code-pushup/utils';
import { configMiddleware } from './config-middleware';
import { getDirname } from './helper.mock';

const getConfigPath = (ext: string) =>
  toUnixPath(`${getDirname(import.meta.url)}/../../../test/config.mock.${ext}`);

describe('applyConfigMiddleware', () => {
  it('should load valid .mjs config', async () => {
    const configPathMjs = getConfigPath('mjs');
    const _config = await configMiddleware({ config: configPathMjs });
    expect(_config.upload?.project).toContain('mjs');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .cjs config', async () => {
    const configPathCjs = getConfigPath('cjs');
    const _config = await configMiddleware({ config: configPathCjs });
    expect(_config.upload?.project).toContain('cjs');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .js config', async () => {
    const configPathJs = getConfigPath('js');
    const _config = await configMiddleware({ config: configPathJs });
    expect(_config.upload?.project).toContain('js');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should throw with invalid config', async () => {
    const invalidConfig = join('wrong', 'path', 'to', 'config');
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
