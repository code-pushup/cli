import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { afterEach, expect } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import { createNpmWorkspace } from '../mocks/create-npm-workshpace';

describe('create-cli-node', () => {
  const baseDir = join('tmp', 'create-cli-e2e');
  const promptTitle = '<↗>  Generating @code-pushup/nx-plugin:configuration';
  const bin = 'dist/packages/create-cli';
  const binPath = (cwd?: string) =>
    cwd ? relative(join(process.cwd(), cwd), join(process.cwd(), bin)) : bin;

  afterEach(async () => {
    await rm(baseDir, { recursive: true });
  });

  it('should execute index.js correctly over node', async () => {
    const cwd = join(baseDir, 'node');
    await createNpmWorkspace(cwd);
    // If we use ESM the following error is thrown
    // Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'dist/packages/create-cli/src/lib/init' imported from dist/packages/create-cli/src/index.js
    const { code, stdout } = await executeProcess({
      command: 'node',
      args: [join(binPath(cwd), 'src/index.js')],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(promptTitle);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should execute index.js correctly over npm exec', async () => {
    const cwd = join(baseDir, 'exec');
    await createNpmWorkspace(cwd);
    // Error: sh: /Users/<username>/.npm/_npx/9876543/node_modules/.bin/create-cli: Permission denied
    const { code, stdout } = await executeProcess({
      command: 'npm',
      args: ['exec', '@code-pushup/create-cli'],
      cwd,
      observer: { onStdout: console.info },
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(promptTitle);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should execute index.js correctly over npx init', async () => {
    const cwd = join(baseDir, 'init');
    await createNpmWorkspace(cwd);
    // Error: npm ERR! could not determine executable to run
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['init', '@code-pushup/create-cli'],
      cwd,
      observer: { onStdout: console.info },
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(promptTitle);
  });
});
