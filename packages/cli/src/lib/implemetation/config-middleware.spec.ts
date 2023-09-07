import { join } from 'path';
import {
  applyConfigMiddlewareToHandler,
  ConfigParseError,
} from './config-middleware';
import { BaseCommandSchema } from '../../index';
import { expect } from 'vitest';

const withDirName = (path: string) => join(__dirname, path);

describe('applyConfigMiddleware', () => {
  it('should load valid config `read-config.mock.mjs`', async () => {
    const configPathMjs = withDirName('mock/config-middleware-config.mock.mjs');
    const calledWith: BaseCommandSchema[] = [];
    const adoptedHandler = applyConfigMiddlewareToHandler(async args => {
      calledWith.push(args);
    });

    await adoptedHandler({ configPath: configPathMjs });
    expect(calledWith.length).toBe(1);
    expect(calledWith[0].configPath).toContain('.mjs');
    expect(calledWith[0].persist.outputPath).toContain('mjs-');
  });

  it('should load valid config `read-config.mock.cjs`', async () => {
    const configPathCjs = withDirName('mock/config-middleware-config.mock.cjs');
    const calledWith: BaseCommandSchema[] = [];
    const adoptedHandler = applyConfigMiddlewareToHandler(async args => {
      calledWith.push(args);
    });

    await adoptedHandler({ configPath: configPathCjs });
    expect(calledWith.length).toBe(1);
    expect(calledWith[0].configPath).toContain('.cjs');
    expect(calledWith[0].persist.outputPath).toContain('cjs-');
  });

  it('should load valid config `read-config.mock.js`', async () => {
    const configPathJs = withDirName('mock/config-middleware-config.mock.js');
    const calledWith: BaseCommandSchema[] = [];
    const adoptedHandler = applyConfigMiddlewareToHandler(async args => {
      calledWith.push(args);
      return void 0;
    });
    await adoptedHandler({ configPath: configPathJs });
    expect(calledWith.length).toBe(1);
    expect(calledWith[0].configPath).toContain('.js');
    expect(calledWith[0].persist.outputPath).toContain('js-');
  });

  it('should throws with invalid configPath', async () => {
    const z = applyConfigMiddlewareToHandler(async () => void 0);
    const configPath = 'wrong/path/to/config';
    expect(() => z({ configPath })).toThrowError(
      new ConfigParseError(configPath),
    );
  });

  it('should provide default configPath', async () => {
    const z = applyConfigMiddlewareToHandler(async () => void 0);
    const defaultConfigPath = 'cpu-config.js';
    expect(() => z({ configPath: undefined })).toThrowError(
      new ConfigParseError(defaultConfigPath),
    );
  });
});
