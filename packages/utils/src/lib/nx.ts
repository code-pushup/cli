import type { ProjectGraph } from '@nx/devkit';
import { stringifyError } from './errors.js';
import { logger } from './logger.js';

/**
 * Creates the project graph for the current Nx workspace.
 */
export async function createProjectGraph(): Promise<ProjectGraph> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  return createProjectGraphAsync({ exitOnError: false });
}

/**
 * Resolves the cached project graph for the current Nx workspace.
 * Tries to read from cache first, falls back to async creation.
 */
export async function resolveCachedProjectGraph(): Promise<ProjectGraph> {
  const { readCachedProjectGraph } = await import('@nx/devkit');
  try {
    return readCachedProjectGraph();
  } catch (error) {
    logger.warn(
      `Could not read cached project graph, falling back to async creation.\n${stringifyError(error)}`,
    );
    return createProjectGraph();
  }
}
