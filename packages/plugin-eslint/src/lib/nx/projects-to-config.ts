import type { ProjectConfiguration, ProjectGraph } from '@nx/devkit';
import type { ESLintTarget } from '../config.js';
import { detectConfigVersion } from '../meta/index.js';
import {
  findCodePushupEslintConfig,
  findEslintConfig,
  getLintFilePatterns,
} from './utils.js';

export async function nxProjectsToConfig(
  projectGraph: ProjectGraph,
  predicate: (project: ProjectConfiguration) => boolean = () => true,
): Promise<ESLintTarget[]> {
  // find Nx projects with lint target
  const { readProjectsConfigurationFromProjectGraph } = await import(
    '@nx/devkit'
  );
  const projectsConfiguration =
    readProjectsConfigurationFromProjectGraph(projectGraph);
  const projects = Object.values(projectsConfiguration.projects)
    .filter(project => 'lint' in (project.targets ?? {}))
    .filter(predicate) // apply predicate
    .sort((a, b) => a.root.localeCompare(b.root));

  const format = await detectConfigVersion();

  return Promise.all(
    projects.map(
      async (project): Promise<ESLintTarget> => ({
        eslintrc:
          (await findCodePushupEslintConfig(project, format)) ??
          (await findEslintConfig(project, format)),
        patterns: getLintFilePatterns(project, format),
      }),
    ),
  );
}
