import stylelintPlugin from '@code-pushup/stylelint-plugin';

export default {
  plugins: [
    await stylelintPlugin({
      stylelintrc: '.stylelintrc.json',
      patterns: ['./styles/*.css'],
    }),
  ],
};
