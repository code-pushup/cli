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

  it('should load a valid TS module with a default export', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'valid-ts-default-export.ts'),
      }),
    ).resolves.toBe('valid-ts-default-export');
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      importModule({ filepath: 'path/to/non-existent-export.mjs' }),
    ).rejects.toThrow("File 'path/to/non-existent-export.mjs' does not exist");
  });

  it('should throw if path is a directory', async () => {
    await expect(importModule({ filepath: mockDir })).rejects.toThrow(
      `Expected '${mockDir}' to be a file`,
    );
  });

  it('should throw if file is not valid JS', async () => {
    await expect(
      importModule({ filepath: path.join(mockDir, 'invalid-js-file.json') }),
    ).rejects.toThrow(
      `${path.join(mockDir, 'invalid-js-file.json')} is not a valid JS file`,
    );
  });
});
