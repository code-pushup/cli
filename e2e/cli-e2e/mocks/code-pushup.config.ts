// TODO: import plugins using NPM package names using local registry: https://github.com/flowup/quality-metrics-cli/issues/33
import eslintPlugin from '../../../dist/packages/plugin-eslint';
import lighthousePlugin from '../../../dist/packages/plugin-lighthouse';
import { CoreConfig } from '../../../packages/models/src';

export default {
  persist: { outputDir: 'tmp' },
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://example.com/api',
  },
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        {
          plugin: 'lighthouse',
          type: 'audit',
          slug: 'largest-contentful-paint',
          weight: 1,
        },
      ],
    },
  ],
  plugins: [
    await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
} satisfies CoreConfig;
