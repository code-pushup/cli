import { mergeConfigs } from '@code-pushup/utils';
import { eslintCoreConfigNx } from '../../code-pushup.preset';

// see: https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md#coreconfig
export default mergeConfigs(
  {
    plugins: [],
  },
  await eslintCoreConfigNx(),
);
