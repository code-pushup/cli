import { join } from 'path';

export default {
  persist: { outputDir: join('tmp', 'js') },
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [],
  plugins: [],
};
