import type { ProjectConfiguration } from '@nx/devkit';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readConfigFile, sys } from 'typescript';
import { logger, pluralizeToken, stringifyError } from '@code-pushup/utils';
import { formatMetaLog } from '../format.js';

/**
 * Matches tsconfig.json and tsconfig.*.json, excludes tsconfig.base.json.
 */
function isTsconfigFile(filename: string): boolean {
  if (filename === 'tsconfig.base.json') {
    return false;
  }
  return (
    filename === 'tsconfig.json' ||
    (filename.startsWith('tsconfig.') && filename.endsWith('.json'))
  );
}

/**
 * Returns false for empty configs (files and include both empty arrays).
 */
function hasFilesToCompile(tsconfigPath: string): boolean {
  const { config } = readConfigFile(tsconfigPath, sys.readFile);

  if (!config) {
    return true;
  }

  const { files, include } = config;
  const filesEmpty = Array.isArray(files) && files.length === 0;
  const includeEmpty = Array.isArray(include) && include.length === 0;

  return !(filesEmpty && includeEmpty);
}

/**
 * Resolves the cached project graph for the current Nx workspace.
 * Tries to read from cache first, falls back to async creation.
 */
async function resolveCachedProjectGraph() {
  const { readCachedProjectGraph, createProjectGraphAsync } = await import(
    '@nx/devkit'
  );
  try {
    return readCachedProjectGraph();
  } catch (error) {
    logger.warn(
      `Could not read cached project graph, falling back to async creation.\n${stringifyError(error)}`,
    );
    return await createProjectGraphAsync({ exitOnError: false });
  }
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
    .filter(isTsconfigFile)
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
