import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type MockInstance, describe, expect, it } from 'vitest';
import { importModule } from './file-system.js';

describe('importModule', () => {
  const mockDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'mocks',
    'fixtures',
  );

  let cwdSpy: MockInstance<[], string>;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(mockDir);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('should load a valid ES module', async () => {
    await expect(
      importModule(path.join(mockDir, 'valid-es-module-export.mjs')),
    ).resolves.toBe('valid-es-module-export');
  });

  it('should load a valid CommonJS module', async () => {
    await expect(
      importModule(path.join(mockDir, 'valid-cjs-module-export.cjs')),
    ).resolves.toBe('valid-cjs-module-export');
  });

  it('should load an ES module without default export', async () => {
    await expect(
      importModule(path.join(mockDir, 'no-default-export.mjs')),
    ).resolves.toEqual(
      expect.objectContaining({ exportedVar: 'exported-variable' }),
    );
  });

  it('should load a valid TS module with a default export', async () => {
    await expect(
      importModule(path.join(mockDir, 'valid-ts-default-export.ts')),
    ).resolves.toBe('valid-ts-default-export');
  });

  it('should load a valid TS module that uses custom tsconfig paths', async () => {
    await expect(
      importModule(path.join(mockDir, 'valid-ts-custom-paths.ts'), {
        tsconfig: path.join(mockDir, 'tsconfig.json'),
      }),
    ).resolves.toEqual({
      self: 'valid-ts-custom-paths',
      lib: 'valid-ts-custom-paths-lib',
    });
  });

  it('should load a module if given only file name without directory path', async () => {
    await expect(importModule('valid-es-module-export.mjs')).resolves.toBe(
      'valid-es-module-export',
    );
  });

  it('should load a module with relative path', async () => {
    await expect(
      importModule('../fixtures/valid-es-module-export.mjs'),
    ).resolves.toBe('valid-es-module-export');
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      importModule('path/to/non-existent-export.mjs'),
    ).rejects.toThrow("File 'path/to/non-existent-export.mjs' does not exist");
  });

  it('should throw if path is a directory', async () => {
    await expect(importModule(mockDir)).rejects.toThrow(
      `Expected '${mockDir}' to be a file`,
    );
  });

  it('should throw if file has invalid extension', async () => {
    await expect(importModule('invalid-file-extension.txt')).rejects.toThrow(
      `Unknown file extension ".txt" for ${path.join(mockDir, 'invalid-file-extension.txt')}`,
    );
  });

  it('should throw if file is not valid JS', async () => {
    await expect(
      importModule(path.join(mockDir, 'invalid-js-file.js')),
    ).rejects.toThrow('invalid is not defined');
  });

  it('should throw if referenced tsconfig is missing', async () => {
    await expect(
      importModule(path.join(mockDir, 'valid-ts-custom-paths.ts'), {
        tsconfig: 'path/to/non-existent/tsconfig.json',
      }),
    ).rejects.toThrow(
      "Error reading TypeScript config file at path/to/non-existent/tsconfig.json:\nCannot read file 'path/to/non-existent/tsconfig.json'.",
    );
  });
});
