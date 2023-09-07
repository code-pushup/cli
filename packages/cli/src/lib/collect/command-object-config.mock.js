module.exports = {
  persist: { outputPath: 'command-object-config-out.json' },
  plugins: [
    {
      audits: [],
      runner: {
        command: 'bash',
        args: [
          '-c',
          `echo '${JSON.stringify({
            audits: [],
          })}' > command-object-config-out.json`,
        ],
        outputPath: 'command-object-config-out.json',
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
