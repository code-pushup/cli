// import eslintPlugin from '../../../dist/packages/plugin-eslint';
import { join } from 'path';
import lighthousePlugin from '../../../dist/packages/plugin-lighthouse';

export default {
  persist: { outputDir: join('tmp', 'js') },
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [],
  plugins: [
    // TODO: uncomment once runner is implemented
    // await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
};
