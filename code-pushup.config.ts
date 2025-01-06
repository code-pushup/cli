import 'dotenv/config';
import { z } from 'zod';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
} from './code-pushup.preset.js';
import type { CoreConfig } from './packages/models/src/index.js';
import { stylelintPlugin } from './packages/plugin-stylelint/src/lib/stylelint-plugin';
import { getCategoryRefsFromGroups } from './packages/plugin-stylelint/src/lib/utils';
import { mergeConfigs } from './packages/utils/src/index.js';

// load upload configuration from environment
const envSchema = z.object({
  CP_SERVER: z.string().url(),
  CP_API_KEY: z.string().min(1),
  CP_ORGANIZATION: z.string().min(1),
  CP_PROJECT: z.string().min(1),
});
const { data: env } = await envSchema.safeParseAsync(process.env);

const config: CoreConfig = {
  ...(env && {
    upload: {
      server: env.CP_SERVER,
      apiKey: env.CP_API_KEY,
      organization: env.CP_ORGANIZATION,
      project: env.CP_PROJECT,
    },
  }),

  plugins: [],
};
const stylelintrc =
  'packages/plugin-stylelint/mocks/fixtures/basic/.stylelintrc.json';
export default mergeConfigs(
  config,
  await coverageCoreConfigNx(),
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  await eslintCoreConfigNx(),
  {
    plugins: [
      await stylelintPlugin([
        {
          stylelintrc,
          patterns: 'packages/plugin-stylelint/mocks/fixtures/basic/**/*.css', // Adjust the path to your CSS files
        },
      ]),
    ],
    categories: [
      {
        slug: 'code-style',
        title: 'Code style',
        description:
          'Lint rules that promote **good practices** and consistency in your code.',
        refs: (
          await getCategoryRefsFromGroups([
            {
              stylelintrc,
              patterns:
                'packages/plugin-stylelint/mocks/fixtures/basic/**/*.css', // Adjust the path to your CSS files
            },
          ])
        ).filter(ref => ref.slug === 'suggestions'),
      },
      {
        slug: 'bug-prevention',
        title: 'Bug Prevention',
        description: 'Lint rules that help **prevent bugs** in your code.',
        refs: (
          await getCategoryRefsFromGroups([
            {
              stylelintrc,
              patterns:
                'packages/plugin-stylelint/mocks/fixtures/basic/**/*.css', // Adjust the path to your CSS files
            },
          ])
        ).filter(ref => ref.slug === 'problems'),
      },
    ],
  },
);
