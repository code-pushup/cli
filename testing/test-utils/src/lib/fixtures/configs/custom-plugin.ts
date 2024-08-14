const customPluginConfig = {
  slug: 'good-feels',
  title: 'Good feels',
  icon: 'javascript',
  audits: [
    {
      slug: 'always-perfect',
      title: 'Always perfect',
    },
  ],
  runner: () => [
    {
      slug: 'always-perfect',
      score: 1,
      value: 100,
      displayValue: '✅ Perfect! 👌',
    },
  ],
};

export function customPlugin() {
  return customPluginConfig;
};
export default customPluginConfig;
