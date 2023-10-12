import { join } from 'path';
import { expect } from 'vitest';
import { configMiddleware } from './config-middleware';
import { getDirname } from './helper.mock';

const __dirname = getDirname(import.meta.url);

const withDirName = (path: string) => join(__dirname, path);
const config = (ext: string) =>
  `${withDirName('../../../test/config.mock.')}${ext}`;

describe('applyConfigMiddleware', () => {
  it('should load valid .mjs config', async () => {
    const configPathMjs = config('mjs');
    const _config = await configMiddleware({ config: configPathMjs });
    expect(_config.upload.project).toContain('mjs');
    expect(_config.persist.outputPath).toContain('tmp');
  });

  it('should load valid .cjs config', async () => {
    const configPathCjs = config('cjs');
    const _config = await configMiddleware({ config: configPathCjs });
    expect(_config.upload.project).toContain('cjs');
    expect(_config.persist.outputPath).toContain('tmp');
  });

  it('should load valid .js config', async () => {
    const configPathJs = config('js');
    const _config = await configMiddleware({ config: configPathJs });
    expect(_config.upload.project).toContain('js');
    expect(_config.persist.outputPath).toContain('tmp');
  });

  it('should throw with invalid config', async () => {
    const config = 'wrong/path/to/config';
    let error: Error = new Error();
    await configMiddleware({ config }).catch(e => (error = e));
    expect(error?.message).toContain(config);
  });

  it('should provide default config', async () => {
    const defaultConfigPath = 'code-pushup.config.js';
    let error: Error = new Error();
    await configMiddleware({ config: undefined }).catch(e => (error = e));
    expect(error?.message).toContain(defaultConfigPath);
  });
});
