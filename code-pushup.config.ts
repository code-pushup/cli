import nx from '@nx/devkit';
import 'dotenv/config';
import type { Linter } from 'eslint';
import { stat, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import eslintPlugin from './dist/packages/plugin-eslint';
import type { CoreConfig } from './packages/models/src';

const exists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

// find Nx projects with lint target
const graph = await nx.createProjectGraphAsync({ exitOnError: true });
const projects = Object.values(
  nx.readProjectsConfigurationFromProjectGraph(graph).projects,
).filter(project => 'lint' in (project.targets ?? {}));

// determine plugin parameters
const eslintrc = 'tmp-eslintrc.json';
const patterns = projects.flatMap(project => [
  ...(project.targets?.lint.options.lintFilePatterns ?? []),
  `${project.sourceRoot}/*.test.ts`, // add test file glob to load vitest rules
]);

// create single ESLint config with project-specific overrides
const eslintConfig: Linter.Config = {
  root: true,
  overrides: await Promise.all(
    projects.map(async project => ({
      files: project.targets?.lint.options.lintFilePatterns,
      extends: (await exists(`./${project.root}/code-pushup.eslintrc.json`))
        ? `./${project.root}/code-pushup.eslintrc.json`
        : `./${project.root}/.eslintrc.json`,
    })),
  ),
};
await writeFile(eslintrc, JSON.stringify(eslintConfig, null, 2));

// load upload configuration from environment
const envSchema = z.object({
  CP_SERVER: z.string().url(),
  CP_API_KEY: z.string().min(1),
  CP_ORGANIZATION: z.string().min(1),
  CP_PROJECT: z.string().min(1),
});
const env = await envSchema.parseAsync(process.env);

const config: CoreConfig = {
  persist: {
    outputDir: '.code-pushup',
    filename: 'report',
    format: ['json', 'md'],
  },

  upload: {
    server: env.CP_SERVER,
    apiKey: env.CP_API_KEY,
    organization: env.CP_ORGANIZATION,
    project: env.CP_PROJECT,
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
