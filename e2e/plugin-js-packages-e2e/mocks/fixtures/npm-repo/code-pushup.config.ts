import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import jsPackagesPlugin from '@code-pushup/js-packages-plugin';
import type { CoreConfig } from '@code-pushup/models';

const thisConfigFolder = fileURLToPath(dirname(import.meta.url));

export default {
  persist: { outputDir: thisConfigFolder, format: ['json'] },
  plugins: [
    await jsPackagesPlugin({
      packageManager: 'npm',
      packageJsonPath: join(thisConfigFolder, 'package.json'),
    }),
  ],
} satisfies CoreConfig;
