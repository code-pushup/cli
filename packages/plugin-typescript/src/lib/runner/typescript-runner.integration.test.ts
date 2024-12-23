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
    expect(res).toHaveLength(8);
    expect(res.at(0)?.code).toBe(2322);
  });
});
