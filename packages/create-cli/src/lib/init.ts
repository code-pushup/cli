import {
  ProcessConfig,
  executeProcess,
  objectToCliArgs,
} from '@code-pushup/nx-plugin';
import {
  parseNxProcessOutput,
  setupNxContext,
  teardownNxContext,
} from './utils';

export function nxPluginGenerator(
  generator: 'init' | 'configuration',
  opt: Record<string, unknown> = {},
): ProcessConfig {
  return {
    command: 'npx',
    args: objectToCliArgs({
      _: ['nx', 'g', `@code-pushup/nx-plugin:${generator}`],
      ...opt,
    }),
  };
}

export async function initCodePushup() {
  const setupResult = await setupNxContext();

  await executeProcess({
    ...nxPluginGenerator('init', {
      skipNxJson: true,
    }),
    observer: {
      onStdout: data => {
        console.info(parseNxProcessOutput(data.toString()));
      },
      onError: error => {
        console.error(parseNxProcessOutput(error.message.toString()));
      },
    },
  });

  const { stdout: configStdout, stderr: configStderr } = await executeProcess(
    nxPluginGenerator('configuration', {
      skipTarget: true,
      project: setupResult.projectName,
    }),
  );
  console.info(parseNxProcessOutput(configStdout));
  console.warn(parseNxProcessOutput(configStderr));

  await teardownNxContext(setupResult);
}
