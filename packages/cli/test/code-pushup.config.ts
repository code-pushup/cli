import { CoreConfig } from '@code-pushup/models';

/**
 * This config is most probably a left over as it has no dedicated use case described
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/cli/test/code-pushup.config.ts
 */

const outputDir = 'tmp';

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
      slug: 'sync-dummy-plugin',
      title: 'Dummy Plugin',
      icon: 'javascript',
      docsUrl: 'http://www.my-docs.dev?slug=dummy-plugin',
      audits: [
        {
          slug: 'dummy-audit-1',
          title: 'Dummy Audit 1',
          description: 'A dummy audit to fill the void 1',
          docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-1',
        },
        {
          slug: 'dummy-audit-2',
          title: 'Dummy Audit 2',
          description: 'A dummy audit to fill the void 2',
          docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-2',
        },
        {
          slug: 'dummy-audit-3',
          title: 'Dummy Audit 3',
          description: 'A dummy audit to fill the void 3',
          docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-3',
        },
      ],
      runner: {
        command: 'node',
        args: [
          '-e',
          `require('fs').writeFileSync('${outputDir}/dummy-plugin-1-output.json', '${JSON.stringify(
            [
              {
                title: 'Dummy Audit 1',
                slug: 'dummy-audit-1',
                value: 420,
                score: 0.42,
              },
              {
                title: 'Dummy Audit 2',
                slug: 'dummy-audit-2',
                value: 80,
                score: 0,
              },
              {
                title: 'Dummy Audit 3',
                slug: 'dummy-audit-3',
                value: 12,
                score: 0.12,
              },
            ],
          )}')`,
        ],
        outputFile: `${outputDir}/dummy-plugin-1-output.json`,
      },
    },
    {
      slug: 'dummy-plugin-2',
      title: 'Dummy Plugin that takes time 2',
      icon: 'javascript',
      docsUrl: 'http://www.my-docs.dev?slug=dummy-plugin',
      audits: [
        {
          slug: 'dummy-plugin-2-audit-1',
          title: 'Dummy Audit 1',
        },
      ],
      runner: {
        command: 'node',
        args: [
          '-e',
          `require('fs').writeFileSync('${outputDir}/dummy-plugin-2-output.json', '${JSON.stringify(
            [
              {
                title: 'Dummy Audit 1',
                slug: 'dummy-plugin-2-audit-1',
                value: 420,
                score: 0.42,
              },
            ],
          )}');`,
        ],
        outputFile: `${outputDir}/dummy-plugin-2-output.json`,
      },
    },
  ],
  categories: [
    {
      slug: 'dummy-category-1',
      title: 'Dummy Category 1',
      description: 'A dummy audit to fill the void',
      refs: [
        {
          plugin: 'sync-dummy-plugin',
          type: 'audit',
          slug: 'dummy-audit-1',
          weight: 1,
        },
        {
          plugin: 'sync-dummy-plugin',
          type: 'audit',
          slug: 'dummy-audit-2',
          weight: 6,
        },
      ],
    },
    {
      slug: 'dummy-category-2',
      title: 'Dummy Category 2',
      description: 'A dummy audit to fill the void 2',
      refs: [
        {
          plugin: 'sync-dummy-plugin',
          type: 'audit',
          slug: 'dummy-audit-3',
          weight: 3,
        },
      ],
    },
  ],
} satisfies CoreConfig;
