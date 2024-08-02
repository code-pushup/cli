import { Tree } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { distPluginPackage, executeGenerator } from '../mocks/utils';

function executeConfigurationGenerator(
  args: string[],
  cwd: string = process.cwd(),
) {
  return executeGenerator(args, {
    bin: distPluginPackage(cwd),
    generator: 'configuration',
    cwd,
  });
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

    const { stderr } = await executeConfigurationGenerator(
      [project, '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
  });

  it('should generate conde-pushup.config.ts file and add target to project.json', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--targetName code-pushup', '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.js file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).toContain(
      `CREATE ${join(projectRoot, 'code-pushup.config.ts')}`,
    );
    expect(cleanedStdout).toContain(
      `UPDATE ${join(projectRoot, 'project.json')}`,
    );
  });

  it('should NOT conde-pushup.config.ts file if one already exists', async () => {
    const cwd = join(baseDir, 'configure-config-existing');
    generateCodePushupConfig(tree, projectRoot);
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).not.toContain(
      `CREATE ${join(projectRoot, 'code-pushup.config.ts')}`,
    );
    expect(cleanedStdout).toContain(
      `UPDATE ${join(projectRoot, 'project.json')}`,
    );
  });

  it('should NOT create conde-pushup.config.ts file if skipConfig is given', async () => {
    const cwd = join(baseDir, 'configure-skip-config');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--skipConfig', '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).not.toContain(
      `CREATE ${join(projectRoot, 'code-pushup.config.ts')}`,
    );
    expect(cleanedStdout).toContain(
      `UPDATE ${join(projectRoot, 'project.json')}`,
    );
  });

  it('should NOT add target to project.json if skipTarget is given', async () => {
    const cwd = join(baseDir, 'configure-skip-target');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--skipTarget', '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).toContain(
      `CREATE ${join(projectRoot, 'code-pushup.config.ts')}`,
    );
    expect(cleanedStdout).not.toContain(
      `UPDATE ${join(projectRoot, 'project.json')}`,
    );
  });
});
