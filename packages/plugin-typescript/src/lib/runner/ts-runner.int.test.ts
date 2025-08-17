import { describe, expect } from 'vitest';
import { getTypeScriptDiagnostics } from './ts-runner.js';

describe('getTypeScriptDiagnostics', () => {
  it('should return valid diagnostics', async () => {
    await expect(
      getTypeScriptDiagnostics({
        tsconfig:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
      }),
    ).resolves.toHaveLength(5);
  });
});
