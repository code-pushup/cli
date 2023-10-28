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
const outputFile = join(outputDir, `out.${Date.now()}.json`);

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
        command: 'echo',
        args: [
          `${JSON.stringify([
            {
              title: 'dummy-title',
              slug: 'audit-1',
              value: 0,
              score: 0,
            },
          ])} > ${outputFile}`,
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
