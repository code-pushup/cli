import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  plugins: [
    await eslintPlugin(
      { patterns: ['src/*.js'] },
      {
        artifacts: {
          generateArtifactsCommand:
            'npx eslint src/*.js --format json --output-file ./.code-pushup/eslint-report.json',
          artifactsPaths: ['./.code-pushup/eslint-report.json'],
        },
      },
    ),
  ],
};
