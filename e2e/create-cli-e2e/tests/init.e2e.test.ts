import { dirname } from 'knip/dist/util/path';
import { join, relative } from 'node:path';
import { afterEach, expect } from 'vitest';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { createNpmWorkspace, removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('create-cli-inti', () => {
  const workspaceRoot = 'tmp/e2e/create-cli-e2e';
  const baseDir = 'tmp/e2e/create-cli-e2e/__test__/init';

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should execute package correctly over npm exec', async () => {
    const cwd = join(baseDir, 'npm-exec');
    const userconfig = relative(cwd, join(workspaceRoot, '.npmrc'));
    await createNpmWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: [
        'exec',
        '@code-pushup/create-cli',
        `--userconfig=${userconfig}`,
        `--prefix=${dirname(userconfig)}`,
      ],
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
    const cwd = join(baseDir, 'npm-init');
    const userconfig = relative(cwd, join(workspaceRoot, '.npmrc'));

    await createNpmWorkspace(cwd);

    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: [
        'init',
        '@code-pushup/cli',
        `--userconfig=${userconfig}`,
        `--prefix=${dirname(userconfig)}`,
      ],
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
    const cwd = join(baseDir, 'npm-init-executable');
    const userconfig = relative(cwd, join(workspaceRoot, '.npmrc'));

    await createNpmWorkspace(cwd);

    await executeProcess({
      command: 'npm',
      args: [
        'init',
        '@code-pushup/cli',
        `--userconfig=${userconfig}`,
        `--prefix=${dirname(userconfig)}`,
      ],
      cwd,
    });

    await expect(
      executeProcess({
        command: 'npx',
        args: ['@code-pushup/cli print-config', `--userconfig=${userconfig}`],
        cwd,
      }),
    )
      // @TODO: Generate an executable setup. Edit configuration generator defaults
      .rejects.toThrow('Array must contain at least 1 element(s)');
  });
});
