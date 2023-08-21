import eslintPlugin from '@quality-metrics/eslint-plugin';
import lighthousePlugin from '@quality-metrics/lighthouse-plugin';

export default {
  plugins: [
    eslintPlugin({ config: '.eslintrc.json' }),
    lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
};
