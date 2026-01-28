import type { ProjectConfiguration } from '@nx/devkit';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readConfigFile, sys } from 'typescript';
import {
  logger,
  pluralizeToken,
  resolveCachedProjectGraph,
} from '@code-pushup/utils';
import { formatMetaLog } from '../format.js';

const TSCONFIG_PATTERN = /^tsconfig(\..+)?\.json$/;

/**
 * Returns true only if config explicitly defines files or include with values.
 */
function hasFilesToCompile(tsconfigPath: string): boolean {
  const { config } = readConfigFile(tsconfigPath, sys.readFile);

  if (!config) {
    return false;
  }

  const { files, include } = config;
  const hasFiles = Array.isArray(files) && files.length > 0;
  const hasInclude = Array.isArray(include) && include.length > 0;

  return hasFiles || hasInclude;
}

function isProjectIncluded(
  project: ProjectConfiguration,
  exclude?: string[],
): boolean {
  return !exclude?.includes(project.name ?? '');
}

/**
 * Finds non-empty tsconfig files in a project directory.
 */
async function findTsconfigsInProject(projectRoot: string): Promise<string[]> {
  const absoluteRoot = path.resolve(process.cwd(), projectRoot);
  const files = await readdir(absoluteRoot);

  return files
    .filter(file => TSCONFIG_PATTERN.test(file))
    .filter(file => hasFilesToCompile(path.join(absoluteRoot, file)))
    .map(file => path.join(projectRoot, file));
}

/**
 * Finds all tsconfig files from Nx projects in the workspace.
 *
 * @param options - Configuration options
 * @param options.exclude - Array of project names to exclude
 * @returns Array of tsconfig file paths
 */
export async function tsconfigFromAllNxProjects(
  options: { exclude?: string[] } = {},
): Promise<string[]> {
  const projectGraph = await resolveCachedProjectGraph();

  const { readProjectsConfigurationFromProjectGraph } = await import(
    '@nx/devkit'
  );
  const { projects } = readProjectsConfigurationFromProjectGraph(projectGraph);

  const projectRoots = Object.values(projects)
    .filter(project => isProjectIncluded(project, options.exclude))
    .map(project => project.root)
    .toSorted();

  const tsconfigs = (
    await Promise.all(projectRoots.map(findTsconfigsInProject))
  ).flat();

  logger.info(
    formatMetaLog(
      `Found ${pluralizeToken('tsconfig', tsconfigs.length)} in ${pluralizeToken('Nx project', projectRoots.length)}${
        options.exclude?.length
          ? ` (excluding ${pluralizeToken('project', options.exclude.length)})`
          : ''
      }`,
    ),
  );

  return tsconfigs;
}
