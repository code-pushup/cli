/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { ConfigYaml } from '@verdaccio/types';
import { join } from 'node:path';
import { setupTestFolder, teardownTestFolder } from '@code-pushup/test-setup';
import { projectE2eScope } from '@code-pushup/test-utils';
import { executeProcess, objectToCliArgs } from '@code-pushup/utils';
import { killProcesses, listProcess } from '../debug/utils';
import { START_VERDACCIO_SERVER_TARGET_NAME } from './constants';
import { RegistryResult, VerdaccioCliOnlyOptions } from './types';
import {
  configureRegistry,
  parseRegistryData,
  setupNpmWorkspace,
  unconfigureRegistry,
} from './utils';

export type NxStarVerdaccioOnlyOptions = {
  skipNxCache?: boolean;
  verbose?: boolean;
  targetName?: string;
  projectName: string;
};
export type NxStarVerdaccioOptions = Partial<
  Omit<ConfigYaml, 'storage'> & { directory: string } & VerdaccioCliOnlyOptions
> &
  NxStarVerdaccioOnlyOptions;

export async function nxStartVerdaccioAndSetupEnv({
  projectName,
  directory = projectE2eScope(projectName),
  targetName = START_VERDACCIO_SERVER_TARGET_NAME,
  location = 'project',
  port,
  verbose,
  // reset or remove cached packages and or metadata.
  clear = true,
}: NxStarVerdaccioOptions): Promise<RegistryResult> {
  let startDetected = false;

  // setup NPM workspace environment
  const workspaceRoot = directory ?? projectE2eScope(projectName);
  const storage = join(workspaceRoot, 'storage');
  await setupNpmWorkspace(workspaceRoot, verbose);
  await setupTestFolder(storage);

  return new Promise((resolve, reject) => {
    const positionalArgs = ['exec', 'nx', targetName, projectName ?? '', '--'];
    const args = objectToCliArgs<
      Partial<
        VerdaccioCliOnlyOptions &
          ConfigYaml & { _: string[]; verbose: boolean; cwd: string }
      >
    >({
      _: positionalArgs,
      storage,
      port,
      verbose,
      location,
      clear,
    });

    // a link to the process started by this command, not one of the child processes. (every port is spawned by a command)
    const commandId = positionalArgs.join(' ');

    verbose && console.log(`Start verdaccio with command: ${commandId}`);

    executeProcess({
      command: 'npm',
      args,
      // @TODO understand what it does
      // stdio: 'pipe',
      shell: true,
      observer: {
        onStdout: (data: string) => {
          if (verbose) {
            process.stdout.write(data);
          }

          // STDOUT: warn --- http address - http://localhost:5555/ - verdaccio/5.31.1
          if (!startDetected && data.toString().includes('http://localhost:')) {
            // only setup env one time
            startDetected = true;
            const registryServerData = parseRegistryData(data);
            configureRegistry(registryServerData, workspaceRoot, verbose);

            const result: RegistryResult = {
              registryData: registryServerData,
              // https://verdaccio.org/docs/cli/#default-database-file-location
              storage,
              workspaceRoot,
              stop: () => {
                unconfigureRegistry(result.registryData, verbose);
                // this makes the process throw
                killProcesses({ commandFilter: commandId });
              },
            };

            console.info(
              `Registry started on URL: ${result.registryData.url}, with PID: ${
                listProcess({ commandFilter: commandId }).at(0)?.pid
              }`,
            );
            verbose && console.table(result);

            resolve(result);
          }
        },
        onStderr: (data: string) => {
          if (verbose) {
            process.stdout.write(data);
          }
        },
      },
    }).catch(error => {
      if (error.message !== 'Failed to start verdaccio: undefined') {
        console.error(
          `Error starting ${projectName} verdaccio registry:\n${
            error as Error
          }`,
        );
        reject(error);
      } else {
        reject({
          registryData: { port },
          stop: () => {
            console.log('noop stop function form ??? error' + error.message);
          },
        });
      }
    });
  });
}

export async function teardownVerdaccio(
  activeRegistry: RegistryResult | undefined,
) {
  if (activeRegistry && 'registryData' in activeRegistry) {
    const { stop, registryData, storage, workspaceRoot } = activeRegistry;

    if (stop == null) {
      throw new Error(
        'global e2e teardown script was not able to derive the stop script for the active registry from "activeRegistry"',
      );
    }
    console.info(`Un configure registry: ${registryData.url}`);
    if (typeof stop === 'function') {
      stop();
    } else {
      console.error('Stop is not a function. Type:', typeof stop);
    }

    await teardownTestFolder(storage);
    await teardownTestFolder(workspaceRoot);
  } else {
    throw new Error(`Failed to stop registry.`);
  }
}
