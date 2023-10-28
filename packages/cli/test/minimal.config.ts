import { join } from 'path';
import { CoreConfig } from '@code-pushup/models';

/**
 * This config provides the minimal configurations and is here for general purpose.
 * Multiple tests can rely on it.
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/cli/test/minimal.config.ts
 */

const outputDir = 'tmp';
const pluginProcess = join(
  'packages',
  'cli',
  'test',
  `minimal-plugin-process.mock.mjs`,
);
const outputFile = join(outputDir, `out.${Date.now()}.json`);
const outputData = JSON.stringify([
  {
    title: 'dummy-title',
    slug: 'audit-1',
    value: 0,
    score: 0,
  },
]);

export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputDir },
  plugins: [
    {
      audits: [
        {
          slug: 'audit-1',
          title: 'audit title',
          description: 'audit description',
          docsUrl: 'http://www.my-docs.dev',
        },
      ],
      runner: {
        command: 'node',
        args: [
          pluginProcess,
          '0', // interval
          '0', // steps
          '0', // error
          outputFile,
        ],
        outputFile,
      },
      groups: [],
      slug: 'plugin-1',
      title: 'plugin 1',
      icon: 'javascript',
    },
  ],
  categories: [],
} satisfies CoreConfig;
