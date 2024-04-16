import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { BaseNormalizedExecutorContext } from '../../internal/types';

export type NormalizedExecutorContext = BaseNormalizedExecutorContext & {
  projectName: string;
};
export function normalizeContext(
  context: ExecutorContext,
): NormalizedExecutorContext {
  const {
    projectName = '',
    root: workspaceRoot,
    projectsConfigurations,
  } = context;
  return {
    projectName,
    projectConfig: projectsConfigurations?.projects[projectName],
    workspaceRoot,
  };
}
