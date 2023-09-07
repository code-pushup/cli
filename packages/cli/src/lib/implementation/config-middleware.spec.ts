import { join } from 'path';
import { configMiddleware, ConfigParseError } from './config-middleware';
import { expect } from 'vitest';

const withDirName = (path: string) => join(__dirname, path);

describe('applyConfigMiddleware', () => {
  it('should load valid config `read-config.mock.mjs`', async () => {
    const configPathMjs = withDirName('mock/config-middleware-config.mock.mjs');
    const config = await configMiddleware({ configPath: configPathMjs });
    expect(config.configPath).toContain('.mjs');
    expect(config.persist.outputPath).toContain('mjs-');
  });

  it('should load valid config `read-config.mock.cjs`', async () => {
    const configPathCjs = withDirName('mock/config-middleware-config.mock.cjs');
    const config = await configMiddleware({ configPath: configPathCjs });
    expect(config.configPath).toContain('.cjs');
    expect(config.persist.outputPath).toContain('cjs-');
  });

  it('should load valid config `read-config.mock.js`', async () => {
    const configPathJs = withDirName('mock/config-middleware-config.mock.js');
    const config = await configMiddleware({ configPath: configPathJs });
    expect(config.configPath).toContain('.js');
    expect(config.persist.outputPath).toContain('js-');
  });

  it('should throw with invalid configPath', async () => {
    const configPath = 'wrong/path/to/config';
    let error: Error = new Error();
    await configMiddleware({ configPath }).catch(e => (error = e));
    expect(error?.message).toContain(new ConfigParseError(configPath).message);
  });

  it('should provide default configPath', async () => {
    const defaultConfigPath = 'code-pushup.config.js';
    let error: Error = new Error();
    await configMiddleware({ configPath: undefined }).catch(e => (error = e));
    expect(error?.message).toContain(
      new ConfigParseError(defaultConfigPath).message,
    );
  });
});
