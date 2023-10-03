module.exports = {
  persist: { outputPath: 'cli-config-out.json' },
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
