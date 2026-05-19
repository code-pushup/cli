import type {
  PluginAnswer,
  PluginCodegenInput,
  PluginSetupTree,
} from '@code-pushup/models';
import { createMockTree } from './plugin-setup-tree.mock.js';

export function createMockCodegenInput(
  answers: Record<string, PluginAnswer> = {},
  tree: PluginSetupTree = createMockTree(),
): PluginCodegenInput {
  return {
    answers,
    tree,
    targetDir: '',
    cliArgs: {},
  };
}
