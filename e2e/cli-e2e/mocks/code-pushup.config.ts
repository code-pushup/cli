// TODO: import plugins using NPM package names using local registry: https://github.com/flowup/quality-metrics-cli/issues/33
// import eslintPlugin from '../../../dist/packages/plugin-eslint';
import lighthousePlugin from '../../../dist/packages/plugin-lighthouse';
import { CoreConfig } from '../../../packages/models/src';

export default {
  persist: { outputDir: 'tmp/ts' },
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [],
  plugins: [
    // TODO: uncomment once runner is implemented
    // await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
} satisfies CoreConfig;
