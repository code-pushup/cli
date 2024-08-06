import { Tree } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { afterEach, expect } from 'vitest';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

export function relativePathToDist(testDir: string): string {
  return relative(
    join(process.cwd(), testDir),
    join(process.cwd(), 'dist/packages/nx-plugin'),
  );
}

describe('nx-plugin g init', () => {
  let tree: Tree;
  const project = 'my-lib';
  const baseDir = 'tmp/nx-plugin-e2e/generators/init';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should inform about dry run', async () => {
    const cwd = join(baseDir, 'dry-run');
    await materializeTree(tree, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:init `,
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

  it('should update packages.json and configure nx.json', async () => {
    const cwd = join(baseDir, 'nx-update');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:init `,
        project,
        '--dryRun',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${relativePathToDist(cwd)}:init`,
    );
    expect(cleanedStdout).toMatch(/^UPDATE package.json/m);
    expect(cleanedStdout).toMatch(/^UPDATE nx.json/m);
  });

  it('should skip packages.json update if --skipPackageJson is given', async () => {
    const cwd = join(baseDir, 'skip-packages');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:init `,
        project,
        '--dryRun',
        '--skipPackageJson',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${relativePathToDist(cwd)}:init`,
    );
    expect(cleanedStdout).not.toMatch(/^UPDATE package.json/m);
    expect(cleanedStdout).toMatch(/^UPDATE nx.json/m);
  });
});
