import ansis from 'ansis';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from 'playwright-core';
import { loadSetupScript, runSetup } from './setup.js';

describe('loadSetupScript integration', () => {
  const fixturesDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'mocks',
    'fixtures',
  );

  it('should load a valid setup script with default export', async () => {
    const setupFn = await loadSetupScript(
      path.join(fixturesDir, 'valid-setup.ts'),
    );

    expect(typeof setupFn).toBe('function');
  });

  it('should execute loaded setup script with runSetup', async () => {
    const mockPage = { goto: vi.fn() } as unknown as Page;

    const setupFn = await loadSetupScript(
      path.join(fixturesDir, 'valid-setup.ts'),
    );
    await runSetup(setupFn, mockPage);

    expect(mockPage.goto).toHaveBeenCalledWith('about:blank');
  });

  it('should throw error for setup script without default export', async () => {
    await expect(
      loadSetupScript(path.join(fixturesDir, 'invalid-setup-no-default.ts')),
    ).rejects.toThrow(`Invalid ${ansis.bold('SetupScriptModule')}`);
  });

  it('should throw error for setup script with non-function default export', async () => {
    await expect(
      loadSetupScript(path.join(fixturesDir, 'invalid-setup-wrong-type.ts')),
    ).rejects.toThrow(`Invalid ${ansis.bold('SetupScriptModule')}`);
  });

  it('should throw error for non-existent setup script', async () => {
    await expect(
      loadSetupScript(path.join(fixturesDir, 'non-existent.ts')),
    ).rejects.toThrow('Setup script not found');
  });
});
