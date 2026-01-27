import {
  logger,
  pluralizeToken,
  resolveCachedProjectGraph,
} from '@code-pushup/utils';
import type { ESLintTarget } from '../config.js';
import { formatMetaLog } from '../meta/format.js';
import { filterProjectGraph } from './filter-project-graph.js';
import { nxProjectsToConfig } from './projects-to-config.js';

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
  const projectGraph = await resolveCachedProjectGraph();
  const filteredProjectGraph = filterProjectGraph(
    projectGraph,
    options.exclude,
  );
  const targets = await nxProjectsToConfig(filteredProjectGraph);

  logger.info(
    formatMetaLog(
      [
        `Inferred ${pluralizeToken('lint target', targets.length)} for all Nx projects`,
        options.exclude?.length &&
          `(excluding ${pluralizeToken('project', options.exclude.length)})`,
      ]
        .filter(Boolean)
        .join(' '),
    ),
  );

  return targets;
}

/**
 * @deprecated
 * Helper is renamed, please use `eslintConfigFromAllNxProjects` function instead.
 */
export const eslintConfigFromNxProjects = eslintConfigFromAllNxProjects;
