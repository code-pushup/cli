import { join } from 'node:path';
import coveragePlugin from '@code-pushup/coverage-plugin';
import { CoreConfig } from '@code-pushup/models';

export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [
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
    await coveragePlugin({
      reports: [
        {
          resultsPath: join('e2e', 'cli-e2e', 'mocks', 'fixtures', 'lcov.info'),
          pathToProject: join('packages', 'cli'),
        },
      ],
    }),
  ],
} satisfies CoreConfig;
