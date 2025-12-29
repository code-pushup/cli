import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from 'playwright-core';
import { describe, expect, it, vi } from 'vitest';
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
    const scriptPath = path.join(fixturesDir, 'valid-setup.ts');

    const setupFn = await loadSetupScript(scriptPath);

    expect(typeof setupFn).toBe('function');
  });

  it('should execute loaded setup script with runSetup', async () => {
    const scriptPath = path.join(fixturesDir, 'valid-setup.ts');
    const mockPage = { goto: vi.fn() } as unknown as Page;

    const setupFn = await loadSetupScript(scriptPath);
    await runSetup(setupFn, mockPage);

    expect(mockPage.goto).toHaveBeenCalledWith('about:blank');
  });

  it('should throw error for setup script without default export', async () => {
    const scriptPath = path.join(fixturesDir, 'invalid-setup-no-default.ts');

    await expect(loadSetupScript(scriptPath)).rejects.toThrow(
      /Invalid.*SetupScriptModule/,
    );
  });

  it('should throw error for setup script with non-function default export', async () => {
    const scriptPath = path.join(fixturesDir, 'invalid-setup-wrong-type.ts');

    await expect(loadSetupScript(scriptPath)).rejects.toThrow(
      /Invalid.*SetupScriptModule/,
    );
  });

  it('should throw error for non-existent setup script', async () => {
    const scriptPath = path.join(fixturesDir, 'non-existent.ts');

    await expect(loadSetupScript(scriptPath)).rejects.toThrow(
      /Setup script not found/,
    );
  });
});
