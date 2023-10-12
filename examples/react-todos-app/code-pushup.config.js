// TODO: import plugins using NPM package names using local registry: https://github.com/flowup/quality-metrics-cli/issues/33
import eslintPlugin from '../../dist/packages/plugin-eslint';

export default {
  persist: {
    outputDir: '../../tmp/react-todos-app',
  },
  categories: [],
  plugins: [
    await eslintPlugin({
      eslintrc: '.eslintrc.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    }),
  ],
};
