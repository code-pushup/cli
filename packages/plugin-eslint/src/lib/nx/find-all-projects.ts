import type { ESLintTarget } from '../config';
import { filterProjectGraph } from './filter-project-graph';
import { nxProjectsToConfig } from './projects-to-config';

/**
 * Finds all Nx projects in workspace and converts their lint configurations to Code PushUp ESLint plugin parameters.
 *
 * Allows excluding certain projects from the configuration using the `options.exclude` parameter.
 *
 * Use when you wish to automatically include every Nx project in a single Code PushUp project.
 * If you prefer to include only a subset of your Nx monorepo, specify projects to exclude using the `exclude` option
 * or consider using {@link eslintConfigFromNxProjectAndDeps} for finer control.
 *
 * @example
 * import eslintPlugin, {
 *   eslintConfigFromAllNxProjects,
 * } from '@code-pushup/eslint-plugin';
 *
 * export default {
 *   plugins: [
 *     await eslintPlugin(
 *       await eslintConfigFromAllNxProjects({ exclude: ['server'] })
 *     )
 *   ]
 * }
 *
 * @param options - Configuration options to filter projects
 * @param options.exclude - Array of project names to exclude from the ESLint configuration
 * @returns ESLint config and patterns, intended to be passed to {@link eslintPlugin}
 */
export async function eslintConfigFromAllNxProjects(
  options: { exclude?: string[] } = {},
): Promise<ESLintTarget[]> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const projectGraph = await createProjectGraphAsync({ exitOnError: false });
  const filteredProjectGraph = filterProjectGraph(
    projectGraph,
    options.exclude,
  );
  return nxProjectsToConfig(filteredProjectGraph);
}

/**
 * @deprecated
 * Helper is renamed, please use `eslintConfigFromAllNxProjects` function instead.
 */
export const eslintConfigFromNxProjects = eslintConfigFromAllNxProjects;
