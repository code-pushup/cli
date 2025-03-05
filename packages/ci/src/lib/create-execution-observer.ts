import { type ProcessObserver, isVerbose } from '@code-pushup/utils';

export function createExecutionObserver(
  {
    silent,
  }: {
    silent?: boolean;
  } = { silent: false },
): ProcessObserver {
  return {
    onStderr: stderr => {
      console.warn(stderr);
    },
    ...((!silent || isVerbose()) && {
      onStdout: stdout => {
        console.info(stdout);
      },
    }),
  };
}
