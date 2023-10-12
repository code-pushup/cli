import { join } from 'path';
import { expect } from 'vitest';
import { configMiddleware } from './config-middleware';
import { getDirname } from './helper.mock';

const __dirname = getDirname(import.meta.url);

const withDirName = (path: string) => join(__dirname, path);
const configPath = (ext: string) =>
  `${withDirName('../../../test/config.mock.')}${ext}`;

describe('applyConfigMiddleware', () => {
  it('should load valid .mjs config', async () => {
    const configPathMjs = configPath('mjs');
    const config = await configMiddleware({ configPath: configPathMjs });
    expect(config.upload.project).toContain('mjs');
    expect(config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .cjs config', async () => {
    const configPathCjs = configPath('cjs');
    const config = await configMiddleware({ configPath: configPathCjs });
    expect(config.upload.project).toContain('cjs');
    expect(config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .js config', async () => {
    const configPathJs = configPath('js');
    const config = await configMiddleware({ configPath: configPathJs });
    expect(config.upload.project).toContain('js');
    expect(config.persist.outputDir).toContain('tmp');
  });

  it('should throw with invalid configPath', async () => {
    const configPath = 'wrong/path/to/config';
    let error: Error = new Error();
    await configMiddleware({ configPath }).catch(e => (error = e));
    expect(error?.message).toContain(configPath);
  });

  it('should provide default configPath', async () => {
    const defaultConfigPath = 'code-pushup.config.js';
    let error: Error = new Error();
    await configMiddleware({ configPath: undefined }).catch(e => (error = e));
    expect(error?.message).toContain(defaultConfigPath);
  });
});
