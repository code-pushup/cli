import type { ESLintTarget } from '../config';
import { nxProjectsToConfig } from './projects-to-config';

/**
 * Accepts a target Nx projects, converts lint configurations to Code PushUp ESLint plugin parameters.
 *
 * Use when you wish to include a targeted subset of your Nx monorepo in your Code PushUp project.
 * If you prefer to include all Nx projects, refer to {@link eslintConfigFromAllNxProjects} instead,
 * if you'd like to auto include all dependencies of the provided target project use {@link eslintConfigFromNxProjectAndDeps} instead.
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
): Promise<ESLintTarget[]> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const projectGraph = await createProjectGraphAsync({ exitOnError: false });

  return nxProjectsToConfig(
    projectGraph,
    project => !!project.name && project.name === projectName,
  );
}
