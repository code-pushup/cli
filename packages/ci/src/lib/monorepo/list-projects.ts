import { glob } from 'glob';
import { join } from 'node:path';
import type { Logger, Settings } from '../models';
import { detectMonorepoTool } from './detect-tool';
import { getToolHandler } from './handlers';
import { listPackages } from './packages';
import type { MonorepoHandlerOptions, ProjectConfig } from './tools';

export async function listMonorepoProjects(
  settings: Settings,
): Promise<ProjectConfig[]> {
  if (!settings.monorepo) {
    throw new Error('Monorepo mode not enabled');
  }

  const logger = settings.logger;

  const options = createMonorepoHandlerOptions(settings);

  const tool =
    settings.monorepo === true
      ? await detectMonorepoTool(options)
      : settings.monorepo;
  if (settings.monorepo === true) {
    if (tool) {
      logger.info(`Auto-detected monorepo tool ${tool}`);
    } else {
      logger.info("Couldn't auto-detect any supported monorepo tool");
    }
  } else {
    logger.info(`Using monorepo tool "${tool}" from inputs`);
  }

  if (tool) {
    const handler = getToolHandler(tool);
    const projects = await handler.listProjects(options);
    logger.info(`Found ${projects.length} projects in ${tool} monorepo`);
    logger.debug(`Projects: ${projects.map(({ name }) => name).join(', ')}`);
    return projects;
  }

  if (settings.projects) {
    return listProjectsByGlobs({
      patterns: settings.projects,
      cwd: options.cwd,
      bin: settings.bin,
      logger,
    });
  }

  return listProjectsByNpmPackages({
    cwd: options.cwd,
    bin: settings.bin,
    logger,
  });
}

function createMonorepoHandlerOptions(
  settings: Settings,
): MonorepoHandlerOptions {
  return {
    task: settings.task,
    cwd: settings.directory,
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
