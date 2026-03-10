import { select } from '@inquirer/prompts';
import path from 'node:path';
import {
  MONOREPO_TOOL_DETECTORS,
  type MonorepoTool,
  type WorkspacePackage,
  detectMonorepoTool,
  hasScript,
  listPackages,
  listWorkspaces,
  loadNxProjectGraph,
  logger,
  readPnpmWorkspacePatterns,
  toUnixPath,
} from '@code-pushup/utils';
import type {
  CliArgs,
  ConfigContext,
  SetupMode,
  Tree,
  WizardProject,
} from './types.js';

const TASK_NAME = 'code-pushup';

export async function promptSetupMode(
  targetDir: string,
  cliArgs: CliArgs,
): Promise<ConfigContext> {
  switch (cliArgs.mode) {
    case 'standalone':
      return toContext(cliArgs.mode, null);
    case 'monorepo': {
      const tool = await detectMonorepoTool(targetDir);
      return toContext(cliArgs.mode, tool);
    }
    case undefined: {
      const tool = await detectMonorepoTool(targetDir);
      const mode = cliArgs.yes ? inferMode(tool) : await promptMode(tool);
      return toContext(mode, tool);
    }
  }
}

async function promptMode(tool: MonorepoTool | null): Promise<SetupMode> {
  return select<SetupMode>({
    message: 'Setup mode:',
    choices: [
      { name: 'Standalone (single config)', value: 'standalone' },
      { name: 'Monorepo (per-project configs)', value: 'monorepo' },
    ],
    default: inferMode(tool),
  });
}

function inferMode(tool: MonorepoTool | null): SetupMode {
  return tool ? 'monorepo' : 'standalone';
}

function toContext(mode: SetupMode, tool: MonorepoTool | null): ConfigContext {
  if (mode === 'monorepo' && tool == null) {
    logger.warn('No monorepo tool detected, falling back to standalone mode.');
    return { mode: 'standalone', tool: null };
  }
  return { mode, tool };
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
  if (config.targets[TASK_NAME] != null) {
    return true;
  }
  const updated = {
    ...config,
    targets: {
      ...config.targets,
      [TASK_NAME]: {
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
  if (hasScript(packageJson, TASK_NAME)) {
    return;
  }
  const updated = {
    ...packageJson,
    scripts: {
      ...packageJson.scripts,
      [TASK_NAME]: 'code-pushup',
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
