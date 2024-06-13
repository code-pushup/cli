import { DEFAULT_FLAGS } from 'chrome-launcher/dist/flags.js';
import 'dotenv/config';
import { z } from 'zod';
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
    await lighthousePlugin('https://github.com/code-pushup/cli/#readme', {
      chromeFlags: DEFAULT_FLAGS.concat(['--headless']),
    }),
    await jsPackagesPlugin({ packageManager: 'npm' }),
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
  ],
};

export default config;
