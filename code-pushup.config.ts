import 'dotenv/config';
import { z } from 'zod';
import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
} from './dist/examples/plugins';
import coveragePlugin, {
  getNxCoveragePaths,
} from './dist/packages/plugin-coverage';
import eslintPlugin, {
  eslintConfigFromNxProjects,
} from './dist/packages/plugin-eslint';
import jsPackagesPlugin from './dist/packages/plugin-js-packages';
import {
  lighthouseGroupRef,
  lighthousePlugin,
} from './dist/packages/plugin-lighthouse';
import type { CoreConfig } from './packages/models/src';

// load upload configuration from environment
const envSchema = z
  .object({
    CP_SERVER: z.string().url(),
    CP_API_KEY: z.string().min(1),
    CP_ORGANIZATION: z.string().min(1),
    CP_PROJECT: z.string().min(1),
  })
  .partial();
const env = await envSchema.parseAsync(process.env);

const config: CoreConfig = {
  ...(env.CP_SERVER &&
    env.CP_API_KEY &&
    env.CP_ORGANIZATION &&
    env.CP_PROJECT && {
      upload: {
        server: env.CP_SERVER,
        apiKey: env.CP_API_KEY,
        organization: env.CP_ORGANIZATION,
        project: env.CP_PROJECT,
      },
    }),

  plugins: [
    await eslintPlugin(await eslintConfigFromNxProjects()),

    await coveragePlugin({
      coverageToolCommand: {
        command: 'npx',
        args: [
          'nx',
          'run-many',
          '-t',
          'unit-test',
          'integration-test',
          '--coverage.enabled',
          '--skipNxCache',
        ],
      },
      reports: await getNxCoveragePaths(['unit-test', 'integration-test']),
    }),

    await jsPackagesPlugin({ packageManager: 'npm' }),

    fileSizePlugin({
      directory: './dist/examples/react-todos-app',
      pattern: /\.js$/,
      budget: 174_080, // 170 kB
    }),

    packageJsonPlugin({
      directory: './dist/packages',
      license: 'MIT',
      type: 'module',
    }),

    await lighthousePlugin('https://codepushup.dev/'),
  ],

  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [lighthouseGroupRef('performance')],
    },
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [lighthouseGroupRef('accessibility')],
    },
    {
      slug: 'best-practices',
      title: 'Best Practices',
      refs: [lighthouseGroupRef('best-practices')],
    },
    {
      slug: 'seo',
      title: 'SEO',
      refs: [lighthouseGroupRef('seo')],
    },
    {
      slug: 'pwa',
      title: 'PWA',
      isBinary: true,
      refs: [lighthouseGroupRef('pwa')],
    },
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      description: 'Lint rules that find **potential bugs** in your code.',
      refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      description:
        'Lint rules that promote **good practices** and consistency in your code.',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
    {
      slug: 'code-coverage',
      title: 'Code coverage',
      description: 'Measures how much of your code is **covered by tests**.',
      refs: [
        {
          type: 'group',
          plugin: 'coverage',
          slug: 'coverage',
          weight: 1,
        },
      ],
    },
    {
      slug: 'security',
      title: 'Security',
      description: 'Finds known **vulnerabilities** in 3rd-party packages.',
      refs: [
        {
          type: 'group',
          plugin: 'js-packages',
          slug: 'npm-audit',
          weight: 1,
        },
      ],
    },
    {
      slug: 'updates',
      title: 'Updates',
      description: 'Finds **outdated** 3rd-party packages.',
      refs: [
        {
          type: 'group',
          plugin: 'js-packages',
          slug: 'npm-outdated',
          weight: 1,
        },
      ],
    },
    {
      slug: 'custom-checks',
      title: 'Custom checks',
      refs: [
        ...fileSizeRecommendedRefs,
        packageJsonPerformanceGroupRef,
        packageJsonDocumentationGroupRef,
      ],
    },
  ],
};

export default config;
