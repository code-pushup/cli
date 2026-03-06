import { select } from '@inquirer/prompts';
import path from 'node:path';
import {
  MONOREPO_TOOL_DETECTORS,
  type MonorepoTool,
  type WorkspacePackage,
  hasScript,
  listPackages,
  listWorkspaces,
  loadNxProjectGraph,
  readPnpmWorkspacePatterns,
  toUnixPath,
} from '@code-pushup/utils';
import {
  type CliArgs,
  SETUP_MODES,
  type SetupMode,
  type Tree,
  type WizardProject,
} from './types.js';

const TARGET_NAME = 'code-pushup';

export async function promptSetupMode(
  tool: MonorepoTool | null,
  cliArgs: CliArgs,
): Promise<SetupMode> {
  if (isSetupMode(cliArgs.mode)) {
    return cliArgs.mode;
  }
  const mode = tool ? 'monorepo' : 'standalone';
  if (cliArgs.yes) {
    return mode;
  }
  return select<SetupMode>({
    message: 'Setup mode:',
    choices: [
      { name: 'Standalone (single config)', value: 'standalone' },
      { name: 'Monorepo (per-project configs)', value: 'monorepo' },
    ],
    default: mode,
  });
}

export async function listProjects(
  cwd: string,
  tool: MonorepoTool,
): Promise<WizardProject[]> {
  switch (tool) {
    case 'nx':
      return listNxProjects(cwd);
    case 'pnpm':
      return listPnpmProjects(cwd);
    case 'turbo':
      return listTurboProjects(cwd);
    case 'yarn':
    case 'npm':
      return listWorkspaceProjects(cwd);
  }
}

async function listNxProjects(cwd: string): Promise<WizardProject[]> {
  const graph = await loadNxProjectGraph();
  return Object.values(graph.nodes).map(({ name, data }) => ({
    name,
    directory: path.join(cwd, data.root),
    relativeDir: toUnixPath(data.root),
  }));
}

async function listPnpmProjects(cwd: string): Promise<WizardProject[]> {
  const patterns = await readPnpmWorkspacePatterns(cwd);
  const packages = await listPackages(cwd, patterns);
  return packages.map(pkg => toProject(cwd, pkg));
}

async function listTurboProjects(cwd: string): Promise<WizardProject[]> {
  if (await MONOREPO_TOOL_DETECTORS.pnpm(cwd)) {
    return listPnpmProjects(cwd);
  }
  return listWorkspaceProjects(cwd);
}

async function listWorkspaceProjects(cwd: string): Promise<WizardProject[]> {
  const { workspaces } = await listWorkspaces(cwd);
  return workspaces.map(pkg => toProject(cwd, pkg));
}

export async function addCodePushUpCommand(
  tree: Tree,
  project: WizardProject,
  tool: MonorepoTool | null,
): Promise<void> {
  if (tool === 'nx') {
    const added = await addNxTarget(tree, project);
    if (added) {
      return;
    }
  }
  await addPackageJsonScript(tree, project);
}

async function addNxTarget(
  tree: Tree,
  project: WizardProject,
): Promise<boolean> {
  const filePath = toUnixPath(path.join(project.relativeDir, 'project.json'));
  const raw = await tree.read(filePath);
  if (raw == null) {
    return false;
  }
  const config = JSON.parse(raw);
  if (config.targets[TARGET_NAME] != null) {
    return true;
  }
  const updated = {
    ...config,
    targets: {
      ...config.targets,
      [TARGET_NAME]: {
        executor: 'nx:run-commands',
        options: { command: 'npx code-pushup' },
      },
    },
  };
  await tree.write(filePath, `${JSON.stringify(updated, null, 2)}\n`);
  return true;
}

async function addPackageJsonScript(
  tree: Tree,
  project: WizardProject,
): Promise<void> {
  const filePath = toUnixPath(path.join(project.relativeDir, 'package.json'));
  const raw = await tree.read(filePath);
  if (raw == null) {
    return;
  }
  const packageJson = JSON.parse(raw);
  if (hasScript(packageJson, TARGET_NAME)) {
    return;
  }
  const updated = {
    ...packageJson,
    scripts: {
      ...packageJson.scripts,
      [TARGET_NAME]: 'code-pushup',
    },
  };
  await tree.write(filePath, `${JSON.stringify(updated, null, 2)}\n`);
}

function toProject(cwd: string, pkg: WorkspacePackage): WizardProject {
  return {
    name: pkg.name,
    directory: pkg.directory,
    relativeDir: toUnixPath(path.relative(cwd, pkg.directory)),
  };
}

function isSetupMode(value: string | undefined): value is SetupMode {
  const validValues: readonly string[] = SETUP_MODES;
  return value != null && validValues.includes(value);
}
