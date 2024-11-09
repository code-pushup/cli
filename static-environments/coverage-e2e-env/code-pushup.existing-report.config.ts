import { join } from 'node:path';
import coveragePlugin from '@code-pushup/coverage-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  plugins: [
    await coveragePlugin({
      reports: [join('mocks', 'fixtures', 'lcov.info')],
    }),
  ],
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
} satisfies CoreConfig;
