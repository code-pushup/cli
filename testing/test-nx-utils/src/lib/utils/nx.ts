import {
  type ExecutorContext,
  type NxJsonConfiguration,
  type PluginConfiguration,
  type ProjectConfiguration,
  type ProjectGraph,
  type Tree,
  updateJson,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import type { LibraryGeneratorSchema } from '@nx/js/src/generators/library/schema';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';

const execFileAsync = promisify(execFile);

export function executorContext<
  T extends { projectName: string; cwd?: string },
>(nameOrOpt: string | T): ExecutorContext {
  const { projectName, cwd = process.cwd() } =
    typeof nameOrOpt === 'string' ? { projectName: nameOrOpt } : nameOrOpt;
  return {
    cwd,
    isVerbose: false,
    projectName,
    root: '.',
    projectsConfigurations: {
      projects: {
        [projectName]: {
          name: projectName,
          root: `libs/${projectName}`,
        },
      },
      version: 1,
    },
    nxJsonConfiguration: {},
    projectGraph: { nodes: {}, dependencies: {} } satisfies ProjectGraph,
  };
}

export async function generateWorkspaceAndProject(
  options:
    | string
    | (Omit<Partial<LibraryGeneratorSchema>, 'name'> & {
        name: string;
      }),
) {
  const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  const { name, ...normalizedOptions } =
    typeof options === 'string' ? { name: options } : options;
  await libraryGenerator(tree, {
    name,
    directory: path.join('libs', name),
    tags: 'scope:plugin',
    linter: 'none',
    unitTestRunner: 'none',
    testEnvironment: 'node',
    buildable: false,
    publishable: false,
    ...normalizedOptions,
  });

  return tree;
}

export function registerPluginInWorkspace(
  tree: Tree,
  configuration: PluginConfiguration,
) {
  const normalizedPluginConfiguration =
    typeof configuration === 'string'
      ? {
          plugin: configuration,
        }
      : configuration;
  updateJson(tree, 'nx.json', (json: NxJsonConfiguration) => ({
    ...json,
    plugins: [...(json.plugins ?? []), normalizedPluginConfiguration],
  }));
}

export async function nxShowProjectJson<T extends ProjectConfiguration>(
  cwd: string,
  project: string,
) {
  try {
    const { stdout, stderr } = await execFileAsync(
      'npx',
      ['nx', 'show', 'project', project, '--json'],
      { cwd },
    );

    return { code: 0, stderr, projectJson: JSON.parse(stdout) as T };
  } catch (error) {
    const execError = error as { code?: number; stderr?: string };
    const fallbackProject: T = { name: project, root: '' } as T;
    return {
      code: execError.code ?? 1,
      stderr: execError.stderr ?? String(error),
      projectJson: fallbackProject,
    };
  }
}
