import { defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig(async () => ({
  ...baseConfig({ projectRoot: __dirname }),
  // Override format to ESM only - this package uses top-level await in constants.ts
  format: ['esm'],
  external: await getExternalDependencies(__dirname),
}));
