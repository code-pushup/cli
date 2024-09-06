import { join, relative } from 'node:path';
import { afterEach, expect } from 'vitest';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import { createNpmWorkspace } from '../mocks/create-npm-workshpace';

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
      args: ['exec', '@code-pushup/create-cli', `--userconfig=${userconfig}`],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<↗>  Generating @code-pushup/nx-plugin:configuration',
    );
  });

  it('should execute package correctly over npm init', async () => {
    const cwd = join(baseDir, 'npm-init');
    const userconfig = relative(cwd, join(workspaceRoot, '.npmrc'));

    await createNpmWorkspace(cwd);

    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: ['init', '@code-pushup/cli', `--userconfig=${userconfig}`],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<↗>  Generating @code-pushup/nx-plugin:configuration',
    );
  });
});
