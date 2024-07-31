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

  it('should generate code-pushup config file and add target to project', async () => {
    const cwd = join(baseDir, 'configure');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--target-name code-pushup', '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.js file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).toContain(
      `CREATE ${projectRoot}/code-pushup.config.ts`,
    );
    expect(cleanedStdout).toContain(`UPDATE ${projectRoot}/project.json`);
  });

  it('should NOT generate code-pushup config if one is already present', async () => {
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
      'NOTE: The "dryRun" flag means no changes were made.',
    );

    expect(cleanedStderr).toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).not.toContain(
      removeColorCodes(`CREATE ${projectRoot}/code-pushup.config.ts`),
    );
    expect(cleanedStdout).toContain(
      removeColorCodes(`UPDATE ${projectRoot}/project.json`),
    );
  });

  it('should run skip config for configuration generator if skipConfig is given', async () => {
    const cwd = join(baseDir, 'configure-skip-config');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--skipConfig', '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).not.toContain(
      `CREATE ${projectRoot}/code-pushup.config.ts`,
    );
    expect(cleanedStdout).toContain(`UPDATE ${projectRoot}/project.json`);
  });

  it('should run skip target for configuration generator if skipTarget is given', async () => {
    const cwd = join(baseDir, 'configure-skip-target');
    await materializeTree(tree, cwd);

    const { code, stdout, stderr } = await executeConfigurationGenerator(
      [project, '--skipTarget', '--dryRun'],
      cwd,
    );

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as code-pushup.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating ${distPluginPackage(cwd)}:configuration`,
    );

    expect(cleanedStdout).toContain(
      `CREATE ${projectRoot}/code-pushup.config.ts`,
    );
    expect(cleanedStdout).not.toContain(`UPDATE ${projectRoot}/project.json`);
  });
});
