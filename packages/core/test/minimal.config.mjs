import { join } from 'path';

/**
 * This config provides the minimal configurations and is here for general purpose.
 * Tests in `core` can rely on it.
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/core/test/minimal.config.ts
 */

const outputDir = 'tmp';
const pluginProcess = join(
  'packages',
  'cli',
  'test',
  `minimal-plugin-process.mock.mjs`,
);
const outputFile = join(outputDir, `out.${Date.now()}.json`);
export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'm0ck-API-k3y',
    server: 'http://test.server.io',
  },
  persist: { outputDir },
  plugins: [
    {
      slug: 'mock-plugin-slug',
      title: 'Plugin Title',
      audits: [
        {
          slug: 'mock-audit-slug',
          title: 'Audit Title',
          description: 'audit description',
          docsUrl: 'http://www.my-docs.dev',
          score: 0,
          value: 0,
          displayValue: '0x',
          details: {
            issues: [],
          },
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
      icon: 'javascript',
    },
  ],
  categories: [
    {
      slug: 'category-slug-1',
      title: 'Category Title',
      description: 'Category description here',
      docsUrl: 'https://info.dev?category=category-slug',
      refs: [
        {
          type: 'audit',
          plugin: 'mock-plugin-slug',
          slug: 'mock-audit-slug',
          weight: 1,
        },
      ],
    },
  ],
};
