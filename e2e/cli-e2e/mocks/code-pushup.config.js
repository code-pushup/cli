// TODO: import plugins using NPM package names using local registry: https://github.com/flowup/quality-metrics-cli/issues/33
import { join } from 'path';
import eslintPlugin from '../../../dist/packages/plugin-eslint';
import lighthousePlugin from '../../../dist/packages/plugin-lighthouse';

export default {
  persist: { outputDir: join('tmp', 'js') },
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
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
          weight: 1
        }
      ]
    }
  ],
  plugins: [
    await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
};
