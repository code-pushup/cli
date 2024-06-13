import 'dotenv/config';
import { join } from 'path';
import { z } from 'zod';
import type { CoreConfig } from '@code-pushup/models';
import coveragePlugin from '../../dist/packages/plugin-coverage';
import eslintPlugin, {
  eslintConfigFromNxProject,
} from '../../dist/packages/plugin-eslint';
import jsPackagesPlugin from '../../dist/packages/plugin-js-packages';

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
    await eslintPlugin(await eslintConfigFromNxProject('utils')),
    await jsPackagesPlugin({
      packageManager: 'npm',
      packageJsonPath: join('packages', 'utils', 'package.json'),
    }),
    await coveragePlugin({
      coverageToolCommand: {
        command: 'npx',
        args: [
          'nx',
          'run-many',
          '--project utils',
          '-t',
          'unit-test',
          'integration-test',
          '--coverage.enabled',
          '--skipNxCache',
        ],
      },
      reports: ['unit-tests', 'integration-tests'].map(target =>
        join('coverage', 'utils', target, 'lcov.info'),
      ),
    }),
  ],

  categories: [
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
  ],
};

export default config;
