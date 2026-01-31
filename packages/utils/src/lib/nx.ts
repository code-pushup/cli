import type { ProjectGraph } from '@nx/devkit';
import { stringifyError } from './errors.js';
import { logger } from './logger.js';

/**
 * Loads the Nx project graph for the current workspace.
 * Tries to read from cache first, falls back to async creation.
 */
export async function loadNxProjectGraph(): Promise<ProjectGraph> {
  const { readCachedProjectGraph, createProjectGraphAsync } = await import(
    '@nx/devkit'
  );
  try {
    return readCachedProjectGraph();
  } catch (error) {
    logger.warn(
      `Could not read cached project graph, falling back to async creation.\n${stringifyError(error)}`,
    );
    return createProjectGraphAsync({ exitOnError: false });
  }
}
