import {
  createProjectGraphAsync,
  readProjectsConfigurationFromProjectGraph,
} from '@nx/devkit';
import type { ESLint } from 'eslint';
import type { ESLintPluginConfig } from '../config';
import {
  findCodePushupEslintrc,
  getEslintConfig,
  getLintFilePatterns,
} from './utils';

export async function eslintConfigFromNxProjects(): Promise<ESLintPluginConfig> {
  // find Nx projects with lint target
  const projectGraph = await createProjectGraphAsync({ exitOnError: false });
  const projectsConfiguration =
    readProjectsConfigurationFromProjectGraph(projectGraph);
  const projects = Object.values(projectsConfiguration.projects)
    .filter(project => 'lint' in (project.targets ?? {}))
    .sort((a, b) => a.root.localeCompare(b.root));

  // create single ESLint config with project-specific overrides
  const eslintConfig: ESLint.ConfigData = {
    root: true,
    overrides: await Promise.all(
      projects.map(async project => ({
        files: getLintFilePatterns(project),
        extends:
          (await findCodePushupEslintrc(project)) ?? getEslintConfig(project),
      })),
    ),
  };

  // include patterns from each project
  const patterns = projects.flatMap(project => [
    ...getLintFilePatterns(project),
    // HACK: ESLint.calculateConfigForFile won't find rules included only for subsets of *.ts when globs used
    // so we explicitly provide additional patterns used by @code-pushup/eslint-config to ensure those rules are included
    // this workaround won't be necessary once flat configs are stable (much easier to find all rules)
    `${project.sourceRoot}/*.spec.ts`, // jest/* and vitest/* rules
    `${project.sourceRoot}/*.cy.ts`, // cypress/* rules
    `${project.sourceRoot}/*.stories.ts`, // storybook/* rules
    `${project.sourceRoot}/.storybook/main.ts`, // storybook/no-uninstalled-addons rule
  ]);

  return {
    eslintrc: eslintConfig,
    patterns,
  };
}
