import { join } from 'node:path';
import { CoreConfig } from '../../../../packages/models/src';

export default {
  persist: { outputDir: join('tmp', 'ts'), filename: 'output.json' },
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [],
  plugins: [],
} satisfies CoreConfig;
