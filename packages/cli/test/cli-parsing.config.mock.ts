import { join } from 'path';
import { CoreConfig } from '@code-pushup/models';
import { echoRunnerConfig } from '../../models/test';

/**
 * This config is here to test CLI arguments parsing e.g. `--verbose` or `--format=md stdout`
 * as well as the config file parsing, the content of this file
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/cli/test/cli-parsing.config.mock.ts
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
  persist: {
    outputDir,
    format: ['md', 'stdout', 'json'],
  },
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
      runner: echoRunnerConfig(
        [
          {
            slug: 'audit-1',
            value: 350,
            score: 0.68,
            displayValue: '350ms',
          },
        ],
        outputFile,
      ),

      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
      icon: 'javascript',
    },
  ],
  categories: [],
} satisfies CoreConfig;
