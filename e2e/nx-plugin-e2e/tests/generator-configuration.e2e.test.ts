import type { Tree } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
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

describe('nx-plugin g configuration', () => {
  let tree: Tree;
  const project = 'my-lib';
  const projectRoot = path.join('libs', project);
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'generators-configuration',
  );

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should generate code-pushup.config.ts file', async () => {
    const cwd = path.join(testFileDir, 'configure');
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

    await expect(
      readFile(
        path.join(cwd, 'libs', project, 'code-pushup.config.ts'),
        'utf8',
      ),
    ).resolves.not.toThrow();
  });

  it('should NOT create a code-pushup.config.ts file if one already exists', async () => {
    const cwd = path.join(testFileDir, 'configure-config-existing');
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
  });

  it('should NOT create a code-pushup.config.ts file if skipConfig is given', async () => {
    const cwd = path.join(testFileDir, 'configure-skip-config');
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

    await expect(
      readFile(
        path.join(cwd, 'libs', project, 'code-pushup.config.ts'),
        'utf8',
      ),
    ).rejects.toThrow('no such file or directory');
  });

  it('should inform about dry run', async () => {
    const cwd = path.join(testFileDir, 'configure');
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
