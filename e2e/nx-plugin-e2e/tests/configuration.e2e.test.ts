import { Tree } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

// @TODO replace with default bin after https://github.com/code-pushup/cli/issues/643
export function relativePathToDist(testDir: string): string {
  return relative(
    join(process.cwd(), testDir),
    join(process.cwd(), 'dist/packages/nx-plugin'),
  );
}

describe('nx-plugin g configuration', () => {
  let tree: Tree;
  const project = 'my-lib';
  const projectRoot = join('libs', project);
  const baseDir = 'tmp/nx-plugin-e2e/generators/configuration';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should inform about dry run', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:configuration `,
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

  it('should generate conde-pushup.config.ts file and add target to project.json', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:configuration `,
        project,
        '--dryRun',
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
      `NX  Generating ${relativePathToDist(cwd)}:configuration`,
    );
    expect(cleanedStdout).toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).toMatch(/^UPDATE.*project.json/m);
  });

  it('should NOT create a code-pushup.config.ts file if one already exists', async () => {
    const cwd = join(baseDir, 'configure-config-existing');
    generateCodePushupConfig(tree, projectRoot);
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:configuration `,
        project,
        '--dryRun',
      ],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${relativePathToDist(cwd)}:configuration`,
    );
    expect(cleanedStdout).not.toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).toMatch(/^UPDATE.*project.json/m);
  });

  it('should NOT create a code-pushup.config.ts file if skipConfig is given', async () => {
    const cwd = join(baseDir, 'configure-skip-config');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:configuration `,
        project,
        '--dryRun',
        '--skipConfig',
      ],
      cwd,
    });

    expect(code).toBe(0);

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      `NX  Generating ${relativePathToDist(cwd)}:configuration`,
    );
    expect(cleanedStdout).not.toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).toMatch(/^UPDATE.*project.json/m);
  });

  it('should NOT add target to project.json if skipTarget is given', async () => {
    const cwd = join(baseDir, 'configure-skip-target');
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        `${relativePathToDist(cwd)}:configuration `,
        project,
        '--dryRun',
        '--skipTarget',
      ],
      cwd,
    });
    expect(code).toBe(0);

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      `NX  Generating ${relativePathToDist(cwd)}:configuration`,
    );
    expect(cleanedStdout).toMatch(/^CREATE.*code-pushup.config.ts/m);
    expect(cleanedStdout).not.toMatch(/^UPDATE.*project.json/m);
  });
});
