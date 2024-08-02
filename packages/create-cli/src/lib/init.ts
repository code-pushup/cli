// eslint-disable-next-line @nx/enforce-module-boundaries
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

function nxPluginGenerator(
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

  const { stdout: initStdout, stderr: initStderr } = await executeProcess(
    nxPluginGenerator('init', {
      skipNxJson: true,
    }),
  );
  console.info(parseNxProcessOutput(initStdout));
  console.warn(parseNxProcessOutput(initStderr));

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
