import nx from '@nx/devkit';
import 'dotenv/config';
import type { ESLint } from 'eslint';
import { stat } from 'node:fs/promises';
import { join } from 'path';
import { z } from 'zod';
import eslintPlugin from './dist/packages/plugin-eslint';
import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
} from './examples/plugins/src';
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

// create single ESLint config with project-specific overrides
const eslintConfig: ESLint.ConfigData = {
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
// include patterns from each project
const patterns = projects.flatMap(project => [
  ...(project.targets?.lint.options.lintFilePatterns ?? []),
  `${project.sourceRoot}/*.test.ts`, // hack: add test file glob to load vitest rules
]);

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

  plugins: [
    await eslintPlugin({ eslintrc: eslintConfig, patterns }),
    await fileSizePlugin({
      directory: join(process.cwd(), 'dist/packages'),
      pattern: /\.js$/,
      budget: 42000,
    }),
  ],

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
    {
      slug: 'performance',
      title: 'Performance',
      refs: [...fileSizeRecommendedRefs],
    },
  ],
};

export default config;
