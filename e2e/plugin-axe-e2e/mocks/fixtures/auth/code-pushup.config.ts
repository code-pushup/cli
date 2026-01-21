import axePlugin from '@code-pushup/axe-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  plugins: [
    axePlugin('http://localhost:8080/dashboard', {
      setupScript: './axe-setup.ts',
    }),
  ],
} satisfies CoreConfig;
