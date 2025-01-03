import stylelintPlugin from '@code-pushup/stylelint-plugin.js';

export default {
  plugins: [
    await stylelintPlugin({
      stylelintrc: '.stylelintrc.next.json',
      patterns: ['styles/*.css'],
    }),
  ],
};
