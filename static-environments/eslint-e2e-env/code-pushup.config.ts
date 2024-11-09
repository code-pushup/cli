import eslintPlugin from '../../dist/packages/plugin-eslint';

export default {
  plugins: [
    await eslintPlugin({
      eslintrc: '.eslintrc.json',
      patterns: ['*.js'],
    }),
  ],
};
