/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { execSync } from 'child_process';
import { executeProcess } from '../../../packages/utils/src';
import {
  configureRegistry,
  parseRegistryData,
  unconfigureRegistry,
} from './utils';

export type RegistryOptions = {
  // local registry target to run
  localRegistryTarget: string;
  // storage folder for the local registry
  storage?: string;
  verbose?: boolean;
  port?: number;
};

export type RegistryData = {
  protocol: string;
  port: string | number;
  host: string;
  registryNoProtocol: string;
  registry: string;
};

export type RegistryResult = {
  registryData: RegistryData;
  stop: () => void;
};
export default async function startLocalRegistry({
  localRegistryTarget,
  storage,
  verbose,
  port,
}: RegistryOptions): Promise<RegistryResult> {
  if (verbose) {
    console.info(`Set up registry for port: ${port}.`);
  }

  return new Promise((resolve, reject) => {
    executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        localRegistryTarget,
        '--',
        '--location none',
        // reset or remove cached packages and or metadata.
        '--clear true',
        ...(storage ? [`--storage=${storage}`] : []),
        ...(port ? [`--port${String(port)}`] : []),
        ...(verbose ? [`--verbose`] : []),
      ],
      // @TODO understand what it does
      // stdio: 'pipe',
      shell: true,
      observer: {
        onStdout: (data, childProcess) => {
          if (verbose) {
            process.stdout.write(data);
          }

          if (data.toString().includes('//localhost:')) {
            const registryData = parseRegistryData(data);

            configureRegistry(registryData);

            if (verbose) {
              console.info('Registry started:');
              console.table(registryData);
            }

            resolve({
              registryData,
              stop: () => {
                // this makes the process throw
                childProcess?.kill();
                unconfigureRegistry(registryData);
                execSync(
                  `npm config delete ${registryData.registryNoProtocol}/:_authToken`,
                );
              },
            });
          }
        },
        onStderr: data => {
          if (verbose) {
            process.stdout.write(data);
          }
        },
      },
    }).catch(error => {
      if (error.message !== 'Failed to start verdaccio: undefined') {
        reject(error);
      } else {
        reject({
          registryData: { port },
          stop: () => {
            console.log('Stop from executeProcess error' + error.message);
          },
        });
      }
    });
  });
}
