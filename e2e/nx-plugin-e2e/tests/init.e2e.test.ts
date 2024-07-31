import { Tree } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { distPluginPackage, executeGenerator } from '../mocks/utils';

function executeInitGenerator(args: string[], cwd: string = process.cwd()) {
  return executeGenerator(args, {
    bin: distPluginPackage(cwd),
    generator: 'init',
    cwd,
  });
}

describe('nx-plugin g init', () => {
  let tree: Tree;
  const project = 'my-lib';
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

    const { stderr } = await executeInitGenerator([project, '--dryRun'], cwd);

    const cleanedStderr = removeColorCodes(stderr);
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
  });

  it('should update packages.json and configure nx.json', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    // if we don't dryRun we need verdaccio // npm ERR! 404 '@code-pushup/nx-plugin@0.29.0' is not in this registry
    const { code, stdout } = await executeInitGenerator(
      [project, '--dryRun'],
      cwd,
    );
    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:init`,
    );
    expect(cleanedStdout).toContain(`UPDATE package.json`);
    expect(cleanedStdout).toContain(`UPDATE nx.json`);
  });

  it('should skip packages.json update if --skipPackageJson is given', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    // if we don't dryRun we need verdaccio // npm ERR! 404 '@code-pushup/nx-plugin@0.29.0' is not in this registry
    const { code, stdout } = await executeInitGenerator(
      [project, '--skipPackageJson', '--dryRun'],
      cwd,
    );
    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:init`,
    );
    expect(cleanedStdout).not.toContain(`UPDATE package.json`);
    expect(cleanedStdout).toContain(`UPDATE nx.json`);
  });
});
