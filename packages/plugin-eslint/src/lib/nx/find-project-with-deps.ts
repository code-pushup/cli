import { createProjectGraphAsync } from '@nx/devkit';
import type { ESLintPluginConfig } from '../config';
import { nxProjectsToConfig } from './projects-to-config';
import { findAllDependencies } from './traverse-graph';

/**
 * Accepts a target Nx projects, finds projects it depends on, and converts lint configurations to Code PushUp ESLint plugin parameters.
 *
 * Use when you wish to include a targetted subset of your Nx monorepo in your Code PushUp project.
 * If you prefer to include all Nx projects, refer to {@link eslintConfigFromNxProjects} instead.
 *
 * @example
 * import eslintPlugin, {
 *   eslintConfigFromNxProject,
 * } from '@code-pushup/eslint-plugin';
 *
 * const projectName = 'backoffice'; // <-- name from project.json
 *
 * export default {
 *   plugins: [
 *     await eslintPlugin(
 *       await eslintConfigFromNxProject(projectName)
 *     )
 *   ]
 * }
 *
 * @param projectName Nx project serving as main entry point
 * @returns ESLint config and patterns, intended to be passed to {@link eslintPlugin}
 */
export async function eslintConfigFromNxProject(
  projectName: string,
): Promise<ESLintPluginConfig> {
  const projectGraph = await createProjectGraphAsync({ exitOnError: false });

  const dependencies = findAllDependencies(projectName, projectGraph);

  return nxProjectsToConfig(
    projectGraph,
    project =>
      !!project.name &&
      (project.name === projectName || dependencies.has(project.name)),
  );
}
