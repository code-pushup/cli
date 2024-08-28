import {
  type ExecutorContext,
  type NxJsonConfiguration,
  type PluginConfiguration,
  type ProjectConfiguration,
  type Tree,
  updateJson,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import type { LibraryGeneratorSchema } from '@nx/js/src/utils/schema';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { executeProcess } from '@code-pushup/utils';

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
  };
}

export const DISABLE_NX_CACHE_ENV =
  'NX_DAEMON=false\nNX_SKIP_NX_CACHE=true\nNX_CACHE_PROJECT_GRAPH=false\n';
export const DISABLE_NX_CACHE_ENVOBJ = {
  NX_DAEMON: 'false',
  NX_SKIP_NX_CACHE: 'true',
  NX_CACHE_PROJECT_GRAPH: 'false',
};

type GenerateWorkspaceAndProjectOptions = Omit<
  Partial<LibraryGeneratorSchema>,
  'name'
> & {
  name: string;
  env?: string;
};

export async function generateWorkspaceAndProject(
  options: string | GenerateWorkspaceAndProjectOptions,
) {
  const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  const { name, env, ...normalizedOptions } = (
    typeof options === 'string' ? { name: options } : options
  ) as GenerateWorkspaceAndProjectOptions;

  if (env) {
    tree.write('.env', env);
  }

  await libraryGenerator(tree, {
    name,
    directory: 'libs',
    tags: 'scope:plugin',
    linter: 'none',
    unitTestRunner: 'none',
    testEnvironment: 'node',
    buildable: false,
    publishable: false,
    projectNameAndRootFormat: 'derived',
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
  project: string,
  opt: { cwd: string; env?: Record<string, string> },
) {
  const { code, stderr, stdout } = await executeProcess({
    command: 'npx',
    args: ['nx', 'show', `project --json  ${project}`],
    ...opt,
  });

  return { code, stderr, projectJson: JSON.parse(stdout) as T };
}
