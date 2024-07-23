import { ExecutorContext } from '@nx/devkit';

type ExecutorContextOptions = { projectName: string; cwd?: string };
export function executorContext(
  nameOrOpt: string | ExecutorContextOptions,
): Omit<ExecutorContext, 'cwd'> & Partial<Pick<ExecutorContext, 'cwd'>> {
  const { projectName, cwd } =
    typeof nameOrOpt === 'string'
      ? ({ projectName: nameOrOpt } satisfies ExecutorContextOptions)
      : nameOrOpt;
  return {
    cwd,
    isVerbose: false,
    projectName,
    root: '.',
    projectsConfigurations: {
      projects: {
        [projectName]: {
          name: projectName,
          root: `libs/${projectName}`,
        },
      },
      version: 1,
    },
  };
}
