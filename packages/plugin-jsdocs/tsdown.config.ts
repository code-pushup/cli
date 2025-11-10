import { defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig(async () => ({
  ...baseConfig({ projectRoot: __dirname }),
  external: await getExternalDependencies(__dirname),
}));
