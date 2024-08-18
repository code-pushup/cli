import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { afterEach, expect } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import { createNpmWorkspace } from '../mocks/create-npm-workshpace';

describe('create-cli-node', () => {
  const baseDir = join('tmp', 'create-cli-e2e');
  const bin = 'dist/packages/create-cli';
  const binPath = (cwd?: string) =>
    cwd ? relative(join(process.cwd(), cwd), join(process.cwd(), bin)) : bin;

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });


  it('should execute index.js correctly over node', async () => {
    const cwd = join(baseDir, 'node-index.js');
    await createNpmWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'node',
      args: [join(binPath(cwd), 'index.js')],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<↗>  Generating @code-pushup/nx-plugin:configuration',
    );
  });


  it('should execute package correctly over npm exec', async () => {
    const cwd = join(baseDir, 'npm-exec');
    await createNpmWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: ['exec', '@code-pushup/create-cli'],
      cwd,
      observer: { onStdout: console.info },
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<↗>  Generating @code-pushup/nx-plugin:configuration',
    );
  });

// eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should execute package correctly over npm init', async () => {
    const cwd = join(baseDir, 'npm-init');
    await createNpmWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: ['init', '@code-pushup/cli'],
      cwd,
      observer: { onStdout: console.info },
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      '<↗>  Generating @code-pushup/nx-plugin:configuration',
    );
  });
});
