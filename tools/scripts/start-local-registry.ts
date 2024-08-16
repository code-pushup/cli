/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { execFileSync, execSync } from 'child_process';
import { RegistryOptions, RegistryResult } from './types';
import {
  configureRegistry,
  executeProcess,
  findLatestVersion,
  parseRegistryData,
  unconfigureRegistry,
} from './utils';

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
        ...`run ${localRegistryTarget} -- --location none --clear true`.split(
          ' ',
        ),
        ...(storage ? [`--storage`, storage] : []),
        ...(port ? [`--port`, String(port)] : []),
      ],
      options: {
        stdio: 'pipe',
        shell: true,
      },
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
                childProcess.kill();
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
