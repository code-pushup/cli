import { defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig(async () => ({
  ...baseConfig({ projectRoot: __dirname }),
  external: await getExternalDependencies(__dirname),
  copy: [
    {
      from: `${__dirname}/package.json`,
      to: `${__dirname}/dist/package.json`,
    },
    {
      from: `${__dirname}/README.md`,
      to: `${__dirname}/dist/README.md`,
    },
  ],
}));
