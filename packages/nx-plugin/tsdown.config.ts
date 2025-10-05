import { defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig({
  ...baseConfig({ projectRoot: __dirname }),
  format: ['cjs'], // NX supports only commonjs
  external: await getExternalDependencies(__dirname),
  copy: [
    {
      from: `${__dirname}/README.md`,
      to: `${__dirname}/dist/README.md`,
    },
    {
      from: `${__dirname}/generators.json`,
      to: `${__dirname}/dist/generators.json`,
    },
    {
      from: `${__dirname}/executors.json`,
      to: `${__dirname}/dist/executors.json`,
    },
  ],
});
