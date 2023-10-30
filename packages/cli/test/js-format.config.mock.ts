import { join } from 'path';
import { CoreConfig } from '@code-pushup/models';

/**
 * This config file is here to demonstrate the TypeScript version of the 4 different supported versions ('ts' | 'mjs' | 'cjs' | 'js')
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/cli/test/js-format.config.mock.ts
 */

const outputDir = 'tmp';
const outputFile = join(outputDir, `out.${Date.now()}.json`);
export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputDir },
  plugins: [
    {
      audits: [
        {
          slug: 'command-object-audit-slug',
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
              slug: 'command-object-audit-slug',
              value: 0,
              score: 0,
            },
          ])} > ${outputFile}`,
        ],
        outputFile,
      },
      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
      icon: 'javascript',
    },
  ],
  categories: [],
} satisfies CoreConfig;
