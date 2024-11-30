import {
  type ExecutorContext,
  type NxJsonConfiguration,
  type PluginConfiguration,
  type ProjectConfiguration, readJson,
  type Tree,
  updateJson,
} from '@nx/devkit';
import {libraryGenerator} from '@nx/js';
import type {LibraryGeneratorSchema} from '@nx/js/src/utils/schema';
import {createTreeWithEmptyWorkspace} from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import {executeProcess} from '@code-pushup/utils';
import {readFile, writeFile} from "node:fs/promises";

export function executorContext<
  T extends { projectName: string; cwd?: string },
>(nameOrOpt: string | T): ExecutorContext {
  const {projectName, cwd = process.cwd()} =
    typeof nameOrOpt === 'string' ? {projectName: nameOrOpt} : nameOrOpt;
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

export async function generateWorkspaceAndProject(
  options:
    | string
    | (Omit<Partial<LibraryGeneratorSchema>, 'name'> & {
    name: string;
  }),
) {
  const tree = createTreeWithEmptyWorkspace({layout: 'apps-libs'});
  const {name, ...normalizedOptions} =
    typeof options === 'string' ? {name: options} : options;
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

export async function registerPluginInNxJson(
  nxJsonPath: string,
  configuration: PluginConfiguration,
) {
  const normalizedPluginConfiguration =
    typeof configuration === 'string'
      ? {
        plugin: configuration,
      }
      : configuration;
  const json = JSON.parse((await readFile(nxJsonPath)).toString()) as NxJsonConfiguration;
  await writeFile(nxJsonPath, JSON.stringify({
    ...json,
    plugins: [...(json.plugins ?? []), normalizedPluginConfiguration],
  }));
}

export async function nxShowProjectJson<T extends ProjectConfiguration>(
  cwd: string,
  project: string,
) {
  const {code, stderr, stdout} = await executeProcess({
    command: 'npx',
    args: ['nx', 'show', `project --json  ${project}`],
    cwd,
  });

  return {code, stderr, projectJson: JSON.parse(stdout) as T};
}
