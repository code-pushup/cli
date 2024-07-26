import { TargetConfiguration } from '@nx/devkit';
import { CreateNodesOptions } from '../types';

export function codePushupTarget({ projectPrefix }: CreateNodesOptions = {}) {
  return {
    executor: '@code-pushup/nx-plugin:autorun',
    ...(projectPrefix ? { options: { projectPrefix } } : {}),
  } satisfies TargetConfiguration;
}
