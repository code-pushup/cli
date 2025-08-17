import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { importModule } from './file-system.js';

describe('importModule', () => {
  const mockDir = path.join(
    process.cwd(),
    'packages',
    'utils',
    'mocks',
    'fixtures',
  );

  it('should load a valid ES module', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'valid-es-module-export.mjs'),
      }),
    ).resolves.toBe('valid-es-module-export');
  });

  it('should load a valid CommonJS module', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'valid-cjs-module-export.cjs'),
      }),
    ).resolves.toBe('valid-cjs-module-export');
  });

  it('should load an ES module without default export', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'no-default-export.mjs'),
      }),
    ).resolves.toEqual(
      expect.objectContaining({ exportedVar: 'exported-variable' }),
    );
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      importModule({
        filepath: 'path/to/non-existent-export.mjs',
      }),
    ).rejects.toThrow('non-existent-export.mjs');
  });
});
