import { describe, expect } from 'vitest';
import { getTypeScriptDiagnostics } from './ts-runner.js';
import * as utilsModule from './utils.js';

describe('getTypeScriptDiagnostics', () => {
  const validateDiagnosticsSpy = vi.spyOn(utilsModule, 'validateDiagnostics');

  it('should return valid diagnostics', async () => {
    await expect(
      getTypeScriptDiagnostics({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
      }),
    ).resolves.toHaveLength(5);
    expect(validateDiagnosticsSpy).toHaveBeenCalledTimes(1);
  });
});
