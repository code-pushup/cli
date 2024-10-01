import type { Tree } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g configuration', () => {
  let tree: Tree;
  const project = 'my-lib';
  const projectRoot = join('libs', project);
  const baseDir = 'tmp/e2e/nx-plugin-e2e/__test__/generators/configuration';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should generate code-pushup.config.ts file and add target to project.json', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:configuration',
        project,
        '--targetName=code-pushup',
      ],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.js file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      'NX  Generating @code-pushup/nx-plugin:configuration',
    );
    expect(cleanedStdout).toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).toMatch(/^UPDATE.*project.json/m);

    const projectJson = await readFile(
      join(cwd, 'libs', project, 'project.json'),
      'utf8',
    );

    expect(JSON.parse(projectJson)).toStrictEqual(
      expect.objectContaining({
        targets: expect.objectContaining({
          'code-pushup': {
            executor: '@code-pushup/nx-plugin:cli',
          },
        }),
      }),
    );
    await expect(
      readFile(join(cwd, 'libs', project, 'code-pushup.config.ts'), 'utf8'),
    ).resolves.not.toThrow();
  });

  it('should NOT create a code-pushup.config.ts file if one already exists', async () => {
    const cwd = join(baseDir, 'configure-config-existing');
    generateCodePushupConfig(tree, projectRoot);
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: ['nx', 'g', '@code-pushup/nx-plugin:configuration', project],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @code-pushup/nx-plugin:configuration',
    );
    expect(cleanedStdout).not.toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).toMatch(/^UPDATE.*project.json/m);

    const projectJson = await readFile(
      join(cwd, 'libs', project, 'project.json'),
      'utf8',
    );
    expect(JSON.parse(projectJson)).toStrictEqual(
      expect.objectContaining({
        targets: expect.objectContaining({
          'code-pushup': {
            executor: '@code-pushup/nx-plugin:cli',
          },
        }),
      }),
    );
  });

  it('should NOT create a code-pushup.config.ts file if skipConfig is given', async () => {
    const cwd = join(baseDir, 'configure-skip-config');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:configuration',
        project,
        '--skipConfig',
      ],
      cwd,
    });

    expect(code).toBe(0);

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      'NX  Generating @code-pushup/nx-plugin:configuration',
    );
    expect(cleanedStdout).not.toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).toMatch(/^UPDATE.*project.json/m);

    const projectJson = await readFile(
      join(cwd, 'libs', project, 'project.json'),
      'utf8',
    );
    expect(JSON.parse(projectJson)).toStrictEqual(
      expect.objectContaining({
        targets: expect.objectContaining({
          'code-pushup': {
            executor: '@code-pushup/nx-plugin:cli',
          },
        }),
      }),
    );

    await expect(
      readFile(join(cwd, 'libs', project, 'code-pushup.config.ts'), 'utf8'),
    ).rejects.toThrow('no such file or directory');
  });

  it('should NOT add target to project.json if skipTarget is given', async () => {
    const cwd = join(baseDir, 'configure-skip-target');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:configuration',
        project,
        '--skipTarget',
      ],
      cwd,
    });
    expect(code).toBe(0);

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      'NX  Generating @code-pushup/nx-plugin:configuration',
    );
    expect(cleanedStdout).toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).not.toMatch(/^UPDATE.*project.json/m);

    const projectJson = await readFile(
      join(cwd, 'libs', project, 'project.json'),
      'utf8',
    );
    expect(JSON.parse(projectJson)).toStrictEqual(
      expect.objectContaining({
        targets: expect.not.objectContaining({
          'code-pushup': {
            executor: '@code-pushup/nx-plugin:cli',
          },
        }),
      }),
    );

    await expect(
      readFile(join(cwd, 'libs', project, 'code-pushup.config.ts'), 'utf8'),
    ).resolves.toStrictEqual(expect.any(String));
  });

  it('should inform about dry run', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:configuration',
        project,
        '--dryRun',
      ],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
  });
});
