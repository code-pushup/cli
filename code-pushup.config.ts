import nx from '@nx/devkit';
import 'dotenv/config';
import type { Linter } from 'eslint';
import { jsonc } from 'jsonc';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'path';
import { z } from 'zod';
import eslintPlugin from './dist/packages/plugin-eslint';
import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRef,
} from './examples/plugins/file-size.plugin';
import {
  create as lighthousePlugin,
  recommendedRefs as lighthouseRecommendedRefs,
} from './examples/plugins/lighthouse.plugin';
import {
  create as packageVersionPlugin,
  recommendedRefs as packageVersionRecommendedRefs,
} from './examples/plugins/package-version.plugin';
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
const patterns = projects.flatMap(project => [
  ...(project.targets?.lint.options.lintFilePatterns ?? []),
  `${project.sourceRoot}/*.test.ts`, // add test file glob to load vitest rules
]);

// create single ESLint config with project-specific overrides
const eslintConfig: Linter.Config = {
  root: true,
  overrides: projects.map(project => ({
    files: project.targets?.lint.options.lintFilePatterns,
    extends: `./${project.root}/.eslintrc.json`,
  })),
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
const outputDir = join(process.cwd(), '.code-pushup');
const config: CoreConfig = {
  persist: {
    outputDir,
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
    await eslintPlugin({ eslintrc, patterns }),
    await fileSizePlugin({
      directory: join(process.cwd(), 'dist/packages'),
      pattern: /\.js$/,
      budget: 42000,
    }),
    await lighthousePlugin({
      url: 'http://google.com',
      verbose: true,
      headless: 'new',
      outputFile: join('.code-pushup', 'lighthouse-report.json'),
    }),
    await packageVersionPlugin({
      directory: join(process.cwd(), './packages/models'),
      packages: {
        zod: '^3.22.21',
      },
    }),
  ],

  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
        ...packageVersionRecommendedRefs,
      ],
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
      refs: [...fileSizeRecommendedRef, ...lighthouseRecommendedRefs],
    },
  ],
};

export default config;
