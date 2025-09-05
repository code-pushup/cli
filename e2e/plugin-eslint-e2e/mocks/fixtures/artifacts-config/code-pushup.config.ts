import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  plugins: [
    await eslintPlugin(
      { patterns: ['src/*.js'] },
      {
        artifacts: {
          generateArtifactsCommand:
            "npx eslint 'src/*.js' --fix --format json --output-file eslint-report.json",
          artifactsPaths: ['./code-pushup/eslint-report.json'],
        },
      },
    ),
  ],
};
