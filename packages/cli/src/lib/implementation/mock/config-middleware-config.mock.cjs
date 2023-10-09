module.exports = {
  upload: {
    organization: "code-pushup",
    project: "cli-cjs",
    apiKey: process.env.API_KEY,
    server: process.env.SERVER
  },
  persist: { outputPath: 'tmp/cjs-out.json', format: ['json'] },
  plugins: [],
  categories: [],
};
