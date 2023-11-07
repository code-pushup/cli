import nx from '@nx/devkit';
import type { Linter } from 'eslint';
import { jsonc } from 'jsonc';
import { readFile, writeFile } from 'node:fs/promises';
import eslintPlugin from './dist/packages/plugin-eslint';
import type { CoreConfig } from './packages/models/src';

// remove override with temporarily disabled rules
const rootEslintrc = '.eslintrc.json';
const buffer = await readFile(rootEslintrc);
const rootConfig: Linter.Config = jsonc.parse(buffer.toString());
const updatedConfig: Linter.Config = {
  ...rootConfig,
  overrides: rootConfig.overrides?.filter(
    ({ files, rules }) =>
      !(
        files === '*.ts' &&
        Object.values(rules ?? {}).every(entry => entry === 'off')
      ),
  ),
};
await writeFile(rootEslintrc, JSON.stringify(updatedConfig, null, 2));

// find Nx projects with lint target
const graph = await nx.createProjectGraphAsync({ exitOnError: true });
const projects = Object.values(
  nx.readProjectsConfigurationFromProjectGraph(graph).projects,
).filter(project => 'lint' in (project.targets ?? {}));

// determine plugin parameters
const eslintrc = 'tmp-eslintrc.json';
const patterns = projects.flatMap(
  project => project.targets?.lint.options.lintFilePatterns ?? [],
);

// create single ESLint config with project-specific overrides
const eslintConfig: Linter.Config = {
  root: true,
  overrides: projects.map(project => ({
    files: project.targets?.lint.options.lintFilePatterns,
    extends: `./${project.root}/.eslintrc.json`,
  })),
};
await writeFile(eslintrc, JSON.stringify(eslintConfig, null, 2));

const config: CoreConfig = {
  persist: {
    outputDir: '.code-pushup',
    filename: 'report',
    format: ['json', 'md'],
  },

  plugins: [await eslintPlugin({ eslintrc, patterns })],

  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
  ],
};

export default config;
