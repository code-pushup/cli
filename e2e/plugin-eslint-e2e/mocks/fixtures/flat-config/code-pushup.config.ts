import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  plugins: [await eslintPlugin({ patterns: ['src/*.js'] })],
};
