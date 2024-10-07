import { glob } from 'glob';
import { join } from 'node:path';
import type { CIConfig } from '../config';
import { detectMonorepoTool } from './detect-tool';
import { getToolHandler } from './handlers';
import { listPackages } from './packages';
import type { MonorepoHandlerOptions, ProjectConfig } from './tools';

// eslint-disable-next-line max-lines-per-function
export async function listMonorepoProjects(
  config: CIConfig,
): Promise<ProjectConfig[]> {
  if (!config.monorepo) {
    throw new Error('Monorepo mode not enabled');
  }

  const logger = config.logger;

  const options: MonorepoHandlerOptions = {
    task: config.task,
    cwd: config.directory,
    ...(!config.silent && {
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

  const tool =
    config.monorepo === true
      ? await detectMonorepoTool(options)
      : config.monorepo;
  if (config.monorepo === true) {
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

  if (config.projects) {
    const directories = await glob(
      config.projects.map(path => path.replace(/\/$/, '/')),
      { cwd: options.cwd },
    );
    logger.info(
      `Found ${
        directories.length
      } project folders matching "${config.projects.join(
        ', ',
      )}" from configuration`,
    );
    logger.debug(`Projects: ${directories.join(', ')}`);
    return directories.toSorted().map(directory => ({
      name: directory,
      bin: config.bin,
      directory: join(options.cwd, directory),
    }));
  }

  const packages = await listPackages(options.cwd);
  logger.info(`Found ${packages.length} NPM packages in repository`);
  logger.debug(`Projects: ${packages.map(({ name }) => name).join(', ')}`);
  return packages.map(({ name, directory }) => ({
    name,
    bin: config.bin,
    directory,
  }));
}
