import path from 'node:path';
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

const fakeCacheFolderName = () =>
  `fake-cache-${new Date().toISOString().replace(/[:.]/g, '-')}`;

describe('create-cli-init', () => {
  const workspaceRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(workspaceRoot, TEST_OUTPUT_DIR, 'init');

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should execute package correctly over npm exec', async () => {
    const cwd = path.join(testFileDir, 'npm-exec');
    await createNpmWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: [
        'exec',
        '--yes',
        `--cache=${fakeCacheFolderName()}`,
        '@code-pushup/create-cli',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<✓>  Generating @code-pushup/nx-plugin:configuration',
    );

    await expect(
      readJsonFile(path.join(cwd, 'package.json')),
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
      readTextFile(path.join(cwd, 'code-pushup.config.ts')),
    ).resolves.toContain(
      "import type { CoreConfig } from '@code-pushup/models';",
    );
  });

  it('should execute package correctly over npm init', async () => {
    const cwd = path.join(testFileDir, 'npm-init-setup');
    await createNpmWorkspace(cwd);

    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: [
        'init',
        '--yes',
        `--cache=${fakeCacheFolderName()}`,
        '@code-pushup/cli',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<✓>  Generating @code-pushup/nx-plugin:configuration',
    );

    await expect(
      readJsonFile(path.join(cwd, 'package.json')),
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
      readTextFile(path.join(cwd, 'code-pushup.config.ts')),
    ).resolves.toContain(
      "import type { CoreConfig } from '@code-pushup/models';",
    );
  });

  it('should produce an executable setup when running npm exec', async () => {
    const cwd = path.join(testFileDir, 'npm-executable');
    await createNpmWorkspace(cwd);

    await executeProcess({
      command: 'npm',
      args: [
        'exec',
        '--yes',
        `--cache=${fakeCacheFolderName()}`,
        '@code-pushup/create-cli',
      ],
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
