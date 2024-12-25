import { describe, expect } from 'vitest';
import { getDiagnostics } from './typescript-runner.js';

describe('getDiagnostics', () => {
  it('should accept valid options', async () => {
    await expect(
      getDiagnostics({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
      }),
    ).resolves.not.toThrow();
  });

  it('should return diagnostics array', async () => {
    const res = await getDiagnostics({
      tsConfigPath:
        'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
    });
    expect(res).toHaveLength(4);
    expect(res.at(0)?.code).toBe(2307);
  });

  it('should throw if missing tsconfig path', async () => {
    await expect(
      getDiagnostics({
        tsConfigPath: 'missing-tsconfig.json',
      }),
    ).rejects.toThrow('tsconfig not found at: missing-tsconfig.json');
  });

  it('should throw if no files matched by the TypeScript configuration', async () => {
    await expect(
      getDiagnostics({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig-with-exclude.json',
      }),
    ).rejects.toThrow(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  });
});
