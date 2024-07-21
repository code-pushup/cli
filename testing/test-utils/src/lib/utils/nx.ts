import { ExecutorContext } from '@nx/devkit';

export function executorContext(
  nameOrOpt: string | { projectName: string; cwd?: string } = 'my-lib',
): ExecutorContext {
  const { projectName, cwd = '' } =
    typeof nameOrOpt === 'string' ? { projectName: nameOrOpt } : nameOrOpt;
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
