import type { ESLintTarget } from '../config.js';
import { nxProjectsToConfig } from './projects-to-config.js';

/**
 * Accepts a target Nx project, converts its lint configuration to Code PushUp ESLint plugin parameters.
 *
 * Use when you wish to only have a single Nx project as your Code PushUp project, without any other dependencies.
 * If you prefer to include all Nx projects, refer to {@link eslintConfigFromAllNxProjects} instead.
 * If you'd like to auto include all dependencies of the provided target project use {@link eslintConfigFromNxProjectAndDeps} instead.
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
 * @param projectName Nx project name
 * @returns ESLint config and patterns, intended to be passed to {@link eslintPlugin}
 */
export async function eslintConfigFromNxProject(
  projectName: string,
): Promise<ESLintTarget> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const projectGraph = await createProjectGraphAsync({ exitOnError: false });

  const [project] = await nxProjectsToConfig(
    projectGraph,
    ({ name }) => !!name && name === projectName,
  );

  if (!project) {
    throw new Error(`Couldn't find Nx project named "${projectName}"`);
  }

  return project;
}
