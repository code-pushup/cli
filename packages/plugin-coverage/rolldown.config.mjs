import { baseConfig } from '../../rolldown.base.ts';

const projectRoot = import.meta.dirname;

export default baseConfig({
  projectRoot,
  entry: [`${projectRoot}/src/index.ts`, `${projectRoot}/src/bin.ts`],
});
