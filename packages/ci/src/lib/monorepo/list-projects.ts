import { glob } from 'glob';
import { join } from 'node:path';
import type { Logger, Settings } from '../models.js';
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
  runManyCommand?: (onlyProjects?: string[]) => string | Promise<string>;
};

export async function listMonorepoProjects(
  settings: Settings,
): Promise<MonorepoProjects> {
  const logger = settings.logger;
  const options = createMonorepoHandlerOptions(settings);

  const tool = await resolveMonorepoTool(settings, options);

  if (tool) {
    const handler = getToolHandler(tool);
    const projects = await handler.listProjects(options);
    logger.info(`Found ${projects.length} projects in ${tool} monorepo`);
    logger.debug(`Projects: ${projects.map(({ name }) => name).join(', ')}`);
    return {
      tool,
      projects,
      runManyCommand: onlyProjects =>
        handler.createRunManyCommand(options, onlyProjects),
    };
  }

  if (settings.projects) {
    const projects = await listProjectsByGlobs({
      patterns: settings.projects,
      cwd: options.cwd,
      bin: settings.bin,
      logger,
    });
    return { tool, projects };
  }

  const projects = await listProjectsByNpmPackages({
    cwd: options.cwd,
    bin: settings.bin,
    logger,
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
  const logger = settings.logger;

  if (typeof settings.monorepo === 'string') {
    logger.info(`Using monorepo tool "${settings.monorepo}" from inputs`);
    return settings.monorepo;
  }

  const tool = await detectMonorepoTool(options);
  if (tool) {
    logger.info(`Auto-detected monorepo tool ${tool}`);
  } else {
    logger.info("Couldn't auto-detect any supported monorepo tool");
  }

  return tool;
}

function createMonorepoHandlerOptions(
  settings: Settings,
): MonorepoHandlerOptions {
  return {
    task: settings.task,
    cwd: settings.directory,
    parallel: settings.parallel,
    nxProjectsFilter: settings.nxProjectsFilter,
    ...(!settings.silent && {
      observer: {
        onStdout: stdout => {
          console.info(stdout);
        },
        onStderr: stderr => {
          console.warn(stderr);
        },
      },
    }),
  };
}

async function listProjectsByGlobs(args: {
  patterns: string[];
  cwd: string;
  bin: string;
  logger: Logger;
}): Promise<ProjectConfig[]> {
  const { patterns, cwd, bin, logger } = args;

  const directories = await glob(
    patterns.map(path => path.replace(/\/$/, '/')),
    { cwd },
  );

  logger.info(
    `Found ${directories.length} project folders matching "${patterns.join(
      ', ',
    )}" from configuration`,
  );
  logger.debug(`Projects: ${directories.join(', ')}`);

  return directories.toSorted().map(directory => ({
    name: directory,
    bin,
    directory: join(cwd, directory),
  }));
}

async function listProjectsByNpmPackages(args: {
  cwd: string;
  bin: string;
  logger: Logger;
}): Promise<ProjectConfig[]> {
  const { cwd, bin, logger } = args;

  const packages = await listPackages(cwd);

  logger.info(`Found ${packages.length} NPM packages in repository`);
  logger.debug(`Projects: ${packages.map(({ name }) => name).join(', ')}`);

  return packages.map(({ name, directory }) => ({
    name,
    bin,
    directory,
  }));
}
