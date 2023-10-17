// TODO: import plugins using NPM package names using local registry: https://github.com/flowup/quality-metrics-cli/issues/33
// import eslintPlugin from '../../../dist/packages/plugin-eslint';
import lighthousePlugin from '../../../dist/packages/plugin-lighthouse';

export default {
  persist: { outputDir: 'tmp' },
  categories: [],
  plugins: [
    // TODO: uncomment once runner is implemented
    // await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
};
