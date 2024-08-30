import { join } from 'node:path';
import coveragePlugin from '../../../../dist/packages/plugin-coverage';
import eslintPlugin from '../../../../dist/packages/plugin-eslint';
import type { CoreConfig } from '../../../../dist/packages/models';

export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
    {
      slug: 'code-coverage',
      title: 'Code coverage',
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
  plugins: [
    await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    await coveragePlugin({
      reports: [join('e2e', 'cli-e2e', 'mocks', 'fixtures', 'lcov.info')],
    }),
  ],
} satisfies CoreConfig;
