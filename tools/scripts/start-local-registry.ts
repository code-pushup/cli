/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { execFileSync, execSync } from 'child_process';
import { executeProcess } from '../../packages/utils/src';
import { RegistryOptions, RegistryResult } from './types';
import {
  configureRegistry,
  findLatestVersion,
  parseRegistryData,
  unconfigureRegistry,
} from './utils';

export default async ({
  localRegistryTarget,
  storage = './tmp/local-registry/storage',
}: RegistryOptions) => {
  const registryResult = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: true,
  });
  const { stop, ...registryData } = registryResult;

  console.info('Registry started:');
  console.table(registryData);

  global.stopLocalRegistry = stop;

  // Publish all
  execFileSync(
    'npx',
    [
      'nx',
      'run-many',
      '--targets=publish',
      `--ver=${findLatestVersion()}`,
      '--tag=e2e',
    ],
    { env: process.env, stdio: 'inherit', shell: true },
  );
};

// soft copy from https://github.com/nrwl/nx/blob/16.9.x/packages/js/src/plugins/jest/start-local-registry.ts
// original function does not work, because it uses require.resolve('nx') and fork,
// and it does not work with vite
function startLocalRegistry({
  localRegistryTarget,
  storage,
  verbose,
}: RegistryOptions): Promise<Partial<RegistryResult>> {
  return new Promise((resolve, reject) => {
    executeProcess({
      command: 'npx',
      args: [
        'nx',
        ...`run ${localRegistryTarget} --location none --clear true`.split(' '),
        ...(storage ? [`--storage`, storage] : []),
      ],
      stdio: 'pipe',
      shell: true,
      observer: {
        onStdout: (data, childProcess) => {
          if (verbose) {
            process.stdout.write(data);
          }

          if (data.toString().includes('//localhost:')) {
            const registryData = parseRegistryData(data);

            configureRegistry(registryData);

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
        onComplete: () => {
          console.info('local registry onComplete');
        },
      },
    }).catch(error => {
      if (error.message !== 'Failed to start verdaccio: undefined') {
        reject(error);
      } else {
        reject({
          registryData: null,
          stop: () => {
            console.log('Stop from executeProcess error' + error.message);
          },
        });
      }
    });
  });
}
