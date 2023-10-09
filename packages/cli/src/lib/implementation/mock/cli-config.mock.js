module.exports = {
  upload: {
    organization: "code-pushup",
    project: "cli",
    apiKey: process.env.API_KEY,
    server: process.env.SERVER
  },
  persist: {
    outputPath: 'cli-config-out.json',
    format: ['json']
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
