import coveragePlugin from '@code-pushup/coverage-plugin';

export default {
  plugins: [
    await coveragePlugin({
      reports: ['coverage/lcov.info'],
      coverageToolCommand: {
        command: 'npx',
        args: ['vitest', 'run', '--coverage'],
      },
    }),
  ],
  categories: [

  ],
};
