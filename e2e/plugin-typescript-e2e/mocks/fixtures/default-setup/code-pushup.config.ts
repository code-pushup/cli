import type { CoreConfig } from '@code-pushup/models';
import {typescriptPlugin} from "@code-pushup/typescript-plugin";

export default {
  plugins: [
    await typescriptPlugin({
      tsConfigPath: 'tsconfig.json',
    }),
  ],
  categories: [],
} satisfies CoreConfig;
