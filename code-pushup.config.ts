import 'dotenv/config';
import { z } from 'zod';
import type { CoreConfig } from './packages/models/src/index.js';
import { stylelintPlugin } from './packages/plugin-stylelint/src/lib/stylelint-plugin';
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

export default mergeConfigs(
  config,
  /*await coverageCoreConfigNx(),
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  await eslintCoreConfigNx(),*/
  {
    plugins: [
      await stylelintPlugin({
        files: 'packages/plugin-stylelint/mocks/fixtures/basic/**/*.css', // Adjust the path to your CSS files
        config: {
          rules: {
            'color-no-invalid-hex': true,
            'block-no-empty': true,
            'unit-no-unknown': true,
            'no-duplicate-selectors': true,
            'property-no-unknown': true,
            'selector-pseudo-class-no-unknown': true,
            'declaration-block-no-duplicate-properties': true,
            'font-family-no-missing-generic-family-keyword': true,
            'string-no-newline': true,
            'length-zero-no-unit': true,
          },
        },
      }),
    ],
  },
);
