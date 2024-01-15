import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importEsmModule } from './file-system';

describe('importEsmModule', () => {
  const mockDir = join(process.cwd(), 'packages', 'utils', 'mocks', 'fixtures');

  it('should load a valid ES module', async () => {
    await expect(
      importEsmModule({
        filepath: join(mockDir, 'valid-es-module-export.mjs'),
      }),
    ).resolves.toBe('valid-es-module-export');
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      importEsmModule({
        filepath: 'path/to/non-existent-export.mjs',
      }),
    ).rejects.toThrow('non-existent-export.mjs');
  });

  it('should throw if the file does not have any default export', async () => {
    await expect(
      importEsmModule({
        filepath: join(mockDir, 'no-default-export.mjs'),
      }),
    ).rejects.toThrow('No default export found');
  });
});
