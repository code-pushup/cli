module.exports = {
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: process.env.API_KEY,
    server: process.env.SERVER,
  },
  persist: { outputPath: 'tmp/js-out.json', format: ['json'] },
  plugins: [],
  categories: [],
};
