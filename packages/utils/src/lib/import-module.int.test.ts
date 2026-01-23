import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { importModule } from './import-module.js';

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

  it('imports module with default tsconfig when tsconfig undefined', async () => {
    vi.clearAllMocks();
    await expect(
      importModule({
        filepath: path.join(mockDir, 'valid-ts-default-export.ts'),
      }),
    ).resolves.toBe('valid-ts-default-export');
  });

  it('imports module with custom tsconfig', async () => {
    vi.clearAllMocks();
    await expect(
      importModule({
        filepath: path.join(mockDir, 'tsconfig-setup', 'import-alias.ts'),
        tsconfig: path.join(mockDir, 'tsconfig-setup', 'tsconfig.json'),
      }),
    ).resolves.toBe('valid-ts-default-export-utils-export');
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

  it('should load valid JSON', async () => {
    await expect(
      importModule({ filepath: path.join(mockDir, 'invalid-js-file.json') }),
    ).resolves.toStrictEqual({ key: 'value' });
  });
});
