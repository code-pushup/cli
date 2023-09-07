module.exports = {
  persist: { outputPath: 'cli-config-out.json' },
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
      groups: [],
      meta: {
        slug: 'execute-plugin',
        name: 'execute plugin',
        type: 'static-analysis',
      },
    },
  ],
  categories: [],
};
