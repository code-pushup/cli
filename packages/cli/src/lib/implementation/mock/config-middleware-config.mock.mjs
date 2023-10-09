export default {
  upload: {
    organization: "code-pushup",
    project: "cli-mjs",
    apiKey: process.env.API_KEY,
    server: process.env.SERVER
  },
  persist: { outputPath: 'tmp', format: ['json'] },
  plugins: [],
  categories: [],
};
