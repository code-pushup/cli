import { glob } from 'glob';
import path from 'node:path';
import { logDebug, logInfo } from '../log.js';
import type { Settings } from '../models.js';
import { detectMonorepoTool } from './detect-tool.js';
import { getToolHandler } from './handlers/index.js';
import { listPackages } from './packages.js';
import type {
  MonorepoHandlerOptions,
  MonorepoTool,
  ProjectConfig,
} from './tools.js';

export type MonorepoProjects = {
  tool: MonorepoTool | null;
  projects: ProjectConfig[];
  runManyCommand?: RunManyCommand;
};

export type RunManyCommand = (
  onlyProjects?: string[],
) => string | Promise<string>;

export async function listMonorepoProjects(
  settings: Settings,
): Promise<MonorepoProjects> {
  const options = createMonorepoHandlerOptions(settings);

  const tool = await resolveMonorepoTool(settings, options);

  if (tool) {
    const handler = getToolHandler(tool);
    const projects = await handler.listProjects(options);
    logInfo(`Found ${projects.length} projects in ${tool} monorepo`);
    logDebug(`Projects: ${projects.map(({ name }) => name).join(', ')}`);
    return {
      tool,
      projects,
      runManyCommand: onlyProjects =>
        handler.createRunManyCommand(options, {
          all: projects,
          ...(onlyProjects?.length && { only: onlyProjects }),
        }),
    };
  }

  if (settings.projects) {
    const projects = await listProjectsByGlobs({
      patterns: settings.projects,
      cwd: options.cwd,
      bin: settings.bin,
    });
    return { tool, projects };
  }

  const projects = await listProjectsByNpmPackages({
    cwd: options.cwd,
    bin: settings.bin,
  });
  return { tool, projects };
}

async function resolveMonorepoTool(
  settings: Settings,
  options: MonorepoHandlerOptions,
): Promise<MonorepoTool | null> {
  if (!settings.monorepo) {
    // shouldn't happen, handled by caller
    throw new Error('Monorepo mode not enabled');
  }

  if (typeof settings.monorepo === 'string') {
    logInfo(`Using monorepo tool "${settings.monorepo}" from inputs`);
    return settings.monorepo;
  }

  const tool = await detectMonorepoTool(options);
  if (tool) {
    logInfo(`Auto-detected monorepo tool ${tool}`);
  } else {
    logInfo("Couldn't auto-detect any supported monorepo tool");
  }

  return tool;
}

function createMonorepoHandlerOptions({
  task,
  directory,
  parallel,
  nxProjectsFilter,
}: Settings): MonorepoHandlerOptions {
  return {
    task,
    cwd: directory,
    parallel,
    nxProjectsFilter,
  };
}

async function listProjectsByGlobs(args: {
  patterns: string[];
  cwd: string;
  bin: string;
}): Promise<ProjectConfig[]> {
  const { patterns, cwd, bin } = args;

  const directories = await glob(
    patterns.map(pattern => pattern.replace(/\/$/, '/')),
    { cwd },
  );

  logInfo(
    `Found ${directories.length} project folders matching "${patterns.join(
      ', ',
    )}" from configuration`,
  );
  logDebug(`Projects: ${directories.join(', ')}`);

  return directories.toSorted().map(directory => ({
    name: directory,
    bin,
    directory: path.join(cwd, directory),
  }));
}

async function listProjectsByNpmPackages(args: {
  cwd: string;
  bin: string;
}): Promise<ProjectConfig[]> {
  const { cwd, bin } = args;

  const packages = await listPackages(cwd);

  logInfo(`Found ${packages.length} NPM packages in repository`);
  logDebug(`Projects: ${packages.map(({ name }) => name).join(', ')}`);

  return packages.map(({ name, directory }) => ({
    name,
    bin,
    directory,
  }));
}
