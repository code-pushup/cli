import eslintPlugin from '../../dist/packages/plugin-eslint';
import { eslintConfigFromNxProject } from '../../dist/packages/plugin-eslint';
import type { CoreConfig } from '../../packages/models/src';

const eslintPluginPath = await eslintConfigFromNxProject('models');
//throw new Error(JSON.stringify(await eslintPlugin(eslintPluginPath), null, 2))
// see: https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md#coreconfig
const config: CoreConfig = {
  plugins: [await eslintPlugin(eslintPluginPath)],
};

export default config;
