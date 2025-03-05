import jsPackagesPlugin from '@code-pushup/js-packages-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  persist: { outputDir: './' },
  plugins: [await jsPackagesPlugin({ packageManager: 'npm' })],
} satisfies CoreConfig;
