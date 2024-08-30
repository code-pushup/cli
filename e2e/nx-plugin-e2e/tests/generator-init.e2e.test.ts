import type { Tree } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g init', () => {
  let tree: Tree;
  const project = 'my-lib';
  const baseDir = 'tmp/e2e/nx-plugin-e2e/__test__/generators/init';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should inform about dry run when used on init generator', async () => {
    const cwd = join(baseDir, 'dry-run');
    await materializeTree(tree, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: ['nx', 'g', '@code-pushup/nx-plugin:init', project, '--dryRun'],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
  });

  it('should update packages.json and configure nx.json', async () => {
    const cwd = join(baseDir, 'nx-update');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:init',
        project,
        '--skipInstall',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @code-pushup/nx-plugin:init',
    );
    expect(cleanedStdout).toMatch(/^UPDATE package.json/m);
    expect(cleanedStdout).toMatch(/^UPDATE nx.json/m);

    const packageJson = await readFile(join(cwd, 'package.json'), 'utf8');
    const nxJson = await readFile(join(cwd, 'nx.json'), 'utf8');

    expect(JSON.parse(packageJson)).toStrictEqual(
      expect.objectContaining({
        devDependencies: expect.objectContaining({
          '@code-pushup/cli': expect.any(String),
          '@code-pushup/models': expect.any(String),
          '@code-pushup/nx-plugin': expect.any(String),
          '@code-pushup/utils': expect.any(String),
        }),
      }),
    );
    expect(JSON.parse(nxJson)).toStrictEqual(
      expect.objectContaining({
        targetDefaults: expect.objectContaining({
          'code-pushup': {
            cache: true,
            inputs: ['default', '^production'],
          },
        }),
      }),
    );
  });

  it('should skip packages.json update if --skipPackageJson is given', async () => {
    const cwd = join(baseDir, 'skip-packages');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:init',
        project,
        '--skipInstall',
        '--skipPackageJson',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @code-pushup/nx-plugin:init',
    );
    expect(cleanedStdout).not.toMatch(/^UPDATE package.json/m);
    expect(cleanedStdout).toMatch(/^UPDATE nx.json/m);

    const packageJson = await readFile(join(cwd, 'package.json'), 'utf8');
    const nxJson = await readFile(join(cwd, 'nx.json'), 'utf8');

    expect(JSON.parse(packageJson)).toStrictEqual(
      expect.objectContaining({
        devDependencies: expect.not.objectContaining({
          '@code-pushup/cli': expect.any(String),
          '@code-pushup/models': expect.any(String),
          '@code-pushup/nx-plugin': expect.any(String),
          '@code-pushup/utils': expect.any(String),
        }),
      }),
    );
    expect(JSON.parse(nxJson)).toStrictEqual(
      expect.objectContaining({
        targetDefaults: expect.objectContaining({
          'code-pushup': {
            cache: true,
            inputs: ['default', '^production'],
          },
        }),
      }),
    );
  });
});
