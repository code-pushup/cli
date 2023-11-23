import { join } from 'path';

export default {
  persist: { outputDir: join('tmp', 'mjs') },
  upload: {
    organization: 'code-pushup',
    project: 'cli-mjs',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [],
  plugins: [],
};
