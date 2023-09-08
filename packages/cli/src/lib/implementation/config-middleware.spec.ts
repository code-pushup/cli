import { join } from 'path';
import { configMiddleware, ConfigParseError } from './config-middleware';
import { expect } from 'vitest';
import { getDirname } from './utils';

const __dirname = getDirname(import.meta.url);

const withDirName = (path: string) => join(__dirname, path);
const configPath = (ext: string) =>
  `${withDirName('mock/config-middleware-config.mock.')}${ext}`;

describe('applyConfigMiddleware', () => {
  it('should load valid .mjs config', async () => {
    const configPathMjs = configPath('mjs');
    console.log('configPathMjs: ', configPathMjs);
    const config = await configMiddleware({ configPath: configPathMjs });
    expect(config.configPath).toContain('.mjs');
    expect(config.persist.outputPath).toContain('mjs-');
  });

  it('should load valid .cjs config', async () => {
    const configPathCjs = configPath('cjs');
    const config = await configMiddleware({ configPath: configPathCjs });
    expect(config.configPath).toContain('.cjs');
    expect(config.persist.outputPath).toContain('cjs-');
  });

  it('should load valid .js config', async () => {
    const configPathJs = configPath('js');
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
