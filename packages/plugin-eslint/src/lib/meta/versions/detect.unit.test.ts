import { ESLint } from 'eslint';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { detectConfigVersion } from './detect.js';

describe('detectConfigVersion', () => {
  beforeEach(() => {
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should assume flat config if explicitly enabled using environment variable', async () => {
    vi.stubEnv('ESLINT_USE_FLAT_CONFIG', 'true');
    await expect(detectConfigVersion()).resolves.toBe('flat');
  });

  it('should assume legacy config if explicitly disabled using environment variable', async () => {
    vi.stubEnv('ESLINT_USE_FLAT_CONFIG', 'false');
    await expect(detectConfigVersion()).resolves.toBe('legacy');
  });

  it('should assume legacy config for version 8', async () => {
    vi.spyOn(ESLint, 'version', 'get').mockReturnValue('8.56.0');
    await expect(detectConfigVersion()).resolves.toBe('legacy');
  });

  it('should assume flat config for version 8 when eslint.config.js file exists', async () => {
    vi.spyOn(ESLint, 'version', 'get').mockReturnValue('8.56.0');
    vol.fromJSON({ 'eslint.config.js': '' }, MEMFS_VOLUME);
    await expect(detectConfigVersion()).resolves.toBe('flat');
  });

  it('should assume flat config for version 9', async () => {
    vi.spyOn(ESLint, 'version', 'get').mockReturnValue('9.14.0');
    await expect(detectConfigVersion()).resolves.toBe('flat');
  });
});
