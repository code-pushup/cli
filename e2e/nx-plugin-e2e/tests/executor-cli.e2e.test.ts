import { type Tree, updateProjectConfiguration } from '@nx/devkit';
import path from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterAll, afterEach, beforeEach, expect, vi } from 'vitest';
import {
  type AutorunCommandExecutorOptions,
  generateCodePushupConfig,
} from '@code-pushup/nx-plugin';
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
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import { INLINE_PLUGIN } from '../mocks/inline-plugin.js';

async function addTargetToWorkspace(
  tree: Tree,
  options: { cwd: string; project: string },
  executorOptions?: AutorunCommandExecutorOptions,
) {
  const { cwd, project } = options;
  const projectCfg = readProjectConfiguration(tree, project);
  updateProjectConfiguration(tree, project, {
    ...projectCfg,
    targets: {
      ...projectCfg.targets,
      'code-pushup': {
        executor: '@code-pushup/nx-plugin:cli',
        ...(executorOptions && { options: executorOptions }),
      },
    },
  });
  const { root } = projectCfg;
  generateCodePushupConfig(tree, root, {
    plugins: [
      {
        fileImports: '',
        codeStrings: INLINE_PLUGIN,
      },
    ],
  });
  await materializeTree(tree, cwd);
}

describe('executor command', () => {
  let tree: Tree;
  const project = 'my-lib';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'executor-cli',
  );
  const processEnvCP = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('CP_')),
  );

  /* eslint-disable functional/immutable-data, @typescript-eslint/no-dynamic-delete */
  beforeAll(() => {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('CP_'))
      .forEach(([k]) => delete process.env[k]);
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  afterAll(() => {
    Object.entries(processEnvCP).forEach(([k, v]) => (process.env[k] = v));
  });
  /* eslint-enable functional/immutable-data, @typescript-eslint/no-dynamic-delete */

  it('should execute no specific command by default', async () => {
    const cwd = path.join(testFileDir, 'execute-default-command');
    await addTargetToWorkspace(tree, { cwd, project });
    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, '--dryRun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup');
  });

  it('should execute print-config executor', async () => {
    const cwd = path.join(testFileDir, 'execute-print-config-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'print-config'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup print-config');

    await expect(() =>
      readJsonFile(path.join(cwd, '.code-pushup', project, 'report.json')),
    ).rejects.toThrow('');
  });

  it('should execute print-config executor with output', async () => {
    const cwd = path.join(testFileDir, 'execute-print-config-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        `${project}:code-pushup`,
        'print-config',
        '--output=code-pushup.config.json',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup print-config');

    await expect(
      readJsonFile(path.join(cwd, 'code-pushup.config.json')),
    ).resolves.not.toThrow();
  });

  it('should execute print-config executor with api key', async () => {
    const cwd = path.join(testFileDir, 'execute-print-config-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        `${project}:code-pushup`,
        'print-config',
        '--upload.apiKey=a123a',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup print-config');
    expect(cleanStdout).toContain('a123a');

    await expect(() =>
      readJsonFile(path.join(cwd, '.code-pushup', project, 'report.json')),
    ).rejects.toThrow('');
  });

  it('should execute collect executor and merge target and command-line options', async () => {
    const cwd = path.join(testFileDir, 'execute-collect-with-merged-options');
    await addTargetToWorkspace(
      tree,
      { cwd, project },
      {
        persist: {
          outputDir: '.reports',
          filename: 'report',
        },
      },
    );

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        `${project}:code-pushup`,
        'collect',
        '--persist.filename=terminal-report',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      'nx run my-lib:code-pushup collect --persist.filename=terminal-report',
    );
    expect(cleanStdout).toContain('Code PushUp CLI');

    await expect(
      readJsonFile(path.join(cwd, '.reports', 'terminal-report.json')),
    ).resolves.not.toThrow();
  });

  it('should execute collect executor and add report to sub folder named by project', async () => {
    const cwd = path.join(testFileDir, 'execute-collect-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'collect'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup collect');

    const report = await readJsonFile(
      path.join(cwd, '.code-pushup', project, 'report.json'),
    );
    expect(report).toStrictEqual(
      expect.objectContaining({
        plugins: [
          expect.objectContaining({
            slug: 'good-feels',
            audits: [
              expect.objectContaining({
                displayValue: '✅ Perfect! 👌',
                slug: 'always-perfect',
              }),
            ],
          }),
        ],
      }),
    );
  });
});
