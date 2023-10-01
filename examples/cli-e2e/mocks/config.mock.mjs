// TODO: import plugins as NPM package names using local registry: https://github.com/flowup/quality-metrics-cli/issues/33
import eslintPlugin from '../../../dist/packages/plugin-eslint';
import lighthousePlugin from '../../../dist/packages/plugin-lighthouse';

export default {
  persist: { outputPath: 'tmp/cli-config-out.json' },
  categories: [],
  plugins: [
    eslintPlugin({ config: '.eslintrc.json' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
};
