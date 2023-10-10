module.exports = {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: {
    outputPath: 'cli-config-out.json',
    format: ['json'],
  },
  categories: [],
  plugins: [
    {
      audits: [],
      runner: {
        command: 'node',
        args: [
          '-e',
          `require('fs').writeFileSync('tmp/cli-config-out.json', '${JSON.stringify(
            { audits: [] },
          )}')`,
        ],
        outputPath: 'tmp/cli-config-out.json',
      },
      slug: 'execute-plugin',
      title: 'execute plugin',
      icon: 'javascript',
    },
  ],
};
