module.exports = {
  persist: { outputPath: 'cli-config-out.json' },
  categories: [],
  plugins: [
    {
      audits: [],
      runner: {
        command: 'bash',
        args: [
          '-c',
          `echo '${JSON.stringify({
            audits: [],
          })}' > cli-config-out.json`,
        ],
        outputPath: 'cli-config-out.json',
      },
      slug: 'execute-plugin',
      title: 'execute plugin',
    },
  ],
};
