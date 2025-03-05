import { eslintCoreConfigNx } from '../../code-pushup.preset.js';
import { mergeConfigs } from '../../dist/packages/utils/src/index.js';

// see: https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md#coreconfig
export default mergeConfigs(
  {
    plugins: [],
  },
  await eslintCoreConfigNx(),
);
