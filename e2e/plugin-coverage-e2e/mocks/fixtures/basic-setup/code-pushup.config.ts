import coveragePlugin from '@code-pushup/coverage-plugin';

export default {
  plugins: [
    await coveragePlugin({
      reports: ['coverage/lcov.info'],
      coverageToolCommand: {
        command: 'npm',
        args: ['run', 'test'],
      },
    }),
  ],
  categories: [
    {
      slug: 'code-coverage',
      title: 'Code coverage',
      refs: [
        {
          type: 'group',
          plugin: 'coverage',
          slug: 'coverage',
          weight: 1,
        },
      ],
    },
  ],
};
