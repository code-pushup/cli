import type { Tree } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  generateWorkspaceAndProject,
  materializeTree,
  nxTargetProject,
} from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g init', () => {
  let tree: Tree;
  const project = 'my-lib';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'generators-init',
  );

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should inform about dry run when used on init generator', async () => {
    const cwd = path.join(testFileDir, 'dry-run');
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
    const cwd = path.join(testFileDir, 'nx-update');
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

    const packageJson = await readFile(path.join(cwd, 'package.json'), 'utf8');
    const nxJson = await readFile(path.join(cwd, 'nx.json'), 'utf8');

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
    const cwd = path.join(testFileDir, 'skip-packages');
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

    const packageJson = await readFile(path.join(cwd, 'package.json'), 'utf8');
    const nxJson = await readFile(path.join(cwd, 'nx.json'), 'utf8');

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
