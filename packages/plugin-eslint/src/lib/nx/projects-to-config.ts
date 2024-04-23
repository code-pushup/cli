import type { ProjectConfiguration, ProjectGraph } from '@nx/devkit';
import type { ESLintTarget } from '../config';
import {
  findCodePushupEslintrc,
  getEslintConfig,
  getLintFilePatterns,
} from './utils';

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

  return Promise.all(
    projects.map(
      async (project): Promise<ESLintTarget> => ({
        eslintrc:
          (await findCodePushupEslintrc(project)) ?? getEslintConfig(project),
        patterns: [
          ...getLintFilePatterns(project),
          // HACK: ESLint.calculateConfigForFile won't find rules included only for subsets of *.ts when globs used
          // so we explicitly provide additional patterns used by @code-pushup/eslint-config to ensure those rules are included
          // this workaround won't be necessary once flat configs are stable (much easier to find all rules)
          `${project.sourceRoot}/*.spec.ts`, // jest/* and vitest/* rules
          `${project.sourceRoot}/*.cy.ts`, // cypress/* rules
          `${project.sourceRoot}/*.stories.ts`, // storybook/* rules
          `${project.sourceRoot}/.storybook/main.ts`, // storybook/no-uninstalled-addons rule
        ],
      }),
    ),
  );
}
