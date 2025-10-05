import { type ExportsOptions, defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig({
  ...baseConfig({ projectRoot: __dirname }),
  external: await getExternalDependencies(__dirname),
  exports: {
    all: true,
  },
});
