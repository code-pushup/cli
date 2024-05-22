import type { ESLintTarget } from '../config';
import { nxProjectsToConfig } from './projects-to-config';

/**
 * Finds all Nx projects in workspace and converts their lint configurations to Code PushUp ESLint plugin parameters.
 *
 * Use when you wish to automatically include every Nx project in a single Code PushUp project.
 * If you prefer to only include a subset of your Nx monorepo, refer to {@link eslintConfigFromNxProjectAndDeps} instead.
 *
 * @example
 * import eslintPlugin, {
 *   eslintConfigFromAllNxProjects,
 * } from '@code-pushup/eslint-plugin';
 *
 * export default {
 *   plugins: [
 *     await eslintPlugin(
 *       await eslintConfigFromAllNxProjects()
 *     )
 *   ]
 * }
 *
 * @returns ESLint config and patterns, intended to be passed to {@link eslintPlugin}
 */
export async function eslintConfigFromAllNxProjects(): Promise<ESLintTarget[]> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const projectGraph = await createProjectGraphAsync({ exitOnError: false });
  return nxProjectsToConfig(projectGraph);
}

/**
 * @deprecated
 * Helper is renamed, please use `eslintConfigFromAllNxProjects` function instead.
 */
export const eslintConfigFromNxProjects = eslintConfigFromAllNxProjects;
