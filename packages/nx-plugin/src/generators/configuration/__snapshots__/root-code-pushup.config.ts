import type { CoreConfig } from '../dist/packages/models';
import * as myPlugin from 'my-plugin';
import { myPluginCategory } from 'my-plugin';

// see: https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md#coreconfig
export default {
  persist: {
    filename: 'report-123',
  },
  upload: {
    apiKey: '123',
  },
  plugins: [myPlugin({ timeout: 42 })],
  categories: [myPluginCategory()],
} satisfies CoreConfig;
