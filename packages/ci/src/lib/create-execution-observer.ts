import { type ProcessObserver, logger } from '@code-pushup/utils';

export function createExecutionObserver(
  {
    silent,
  }: {
    silent?: boolean;
  } = { silent: false },
): ProcessObserver {
  return {
    onStderr: stderr => {
      logger.warn(stderr);
    },
    ...((!silent || logger.isVerbose()) && {
      onStdout: stdout => {
        logger.info(stdout);
      },
    }),
  };
}
