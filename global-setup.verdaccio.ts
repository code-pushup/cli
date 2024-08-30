import { setup as globalSetup } from './global-setup';
import { executeProcess, objectToCliArgs } from './packages/utils/src';
import {
  VerdaccioEnvResult,
  nxStartVerdaccioAndSetupEnv,
  nxStopVerdaccioAndTeardownEnv,
} from './tools/src/verdaccio/env';

let activeRegistry: VerdaccioEnvResult;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];

export async function setup() {
  await globalSetup();

  activeRegistry = await nxStartVerdaccioAndSetupEnv({
    projectName,
  });

  const { userconfig, workspaceRoot } = activeRegistry;
  await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['nx', 'setup-e2e-deps', projectName],
      registry: activeRegistry.registry.url, // publish
      userconfig, // publish & install
      prefix: workspaceRoot, // install
    }),
    observer: { onStdout: stdout => console.info(stdout) },
  });
}

export async function teardown() {
  // NOTICE - Time saving optimization
  // We skip uninstalling packages as the folder is deleted anyway
  // comment out to see the folder and web interface
  // await nxStopVerdaccioAndTeardownEnv(activeRegistry);
}
