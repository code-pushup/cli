import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  createNpmWorkspace,
  removeColorCodes,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('create-cli-inti', () => {
  const workspaceRoot = join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = join(workspaceRoot, TEST_OUTPUT_DIR, 'init');

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should execute package correctly over npm exec', async () => {
    const cwd = join(testFileDir, 'npm-exec');
    await createNpmWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: ['exec', '@code-pushup/create-cli'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<✓>  Generating @code-pushup/nx-plugin:configuration',
    );

    await expect(
      readJsonFile(join(cwd, 'package.json')),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        devDependencies: {
          '@code-pushup/cli': expect.any(String),
          '@code-pushup/models': expect.any(String),
          '@code-pushup/nx-plugin': expect.any(String),
          '@code-pushup/utils': expect.any(String),
        },
      }),
    );
    await expect(
      readTextFile(join(cwd, 'code-pushup.config.ts')),
    ).resolves.toContain(
      "import type { CoreConfig } from '@code-pushup/models';",
    );
  });

  it('should execute package correctly over npm init', async () => {
    const cwd = join(testFileDir, 'npm-init-setup');
    await createNpmWorkspace(cwd);

    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: ['init', '@code-pushup/cli'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<✓>  Generating @code-pushup/nx-plugin:configuration',
    );

    await expect(
      readJsonFile(join(cwd, 'package.json')),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        devDependencies: {
          '@code-pushup/cli': expect.any(String),
          '@code-pushup/models': expect.any(String),
          '@code-pushup/nx-plugin': expect.any(String),
          '@code-pushup/utils': expect.any(String),
        },
      }),
    );
    await expect(
      readTextFile(join(cwd, 'code-pushup.config.ts')),
    ).resolves.toContain(
      "import type { CoreConfig } from '@code-pushup/models';",
    );
  });

  it('should produce an executable setup when running npm init', async () => {
    const cwd = join(testFileDir, 'npm-init-executable');
    await createNpmWorkspace(cwd);

    await executeProcess({
      command: 'npm',
      args: ['init', '@code-pushup/cli'],
      cwd,
    });

    await expect(
      executeProcess({
        command: 'npx',
        args: ['@code-pushup/cli print-config'],
        cwd,
      }),
    )
      // @TODO: Generate an executable setup. Edit configuration generator defaults
      .rejects.toThrow('Array must contain at least 1 element(s)');
  });
});
