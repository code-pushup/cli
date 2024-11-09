import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  plugins: [
    await eslintPlugin({
      eslintrc: '.eslintrc.json',
      patterns: ['*.js'],
    }),
  ],
};
