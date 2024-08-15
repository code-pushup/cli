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

export default async ({
  localRegistryTarget,
  storage = './tmp/local-registry/storage',
  port,
}: RegistryOptions): Promise<Partial<RegistryResult>> => {
  const registryResult = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: true,
    port,
  });
  const { registryData } = registryResult;

  console.info('Registry started:', port);
  console.table(registryData);

  // Publish all
  execFileSync(
    'npx',
    [
      'nx',
      'run-many',
      '--targets=publish',
      `--ver=${findLatestVersion()}`,
      '--tag=e2e',
      `--registry=${registryData.registry}`,
    ],
    { env: process.env, stdio: 'inherit', shell: true },
  );

  return registryResult;
};

function startLocalRegistry({
  localRegistryTarget,
  storage,
  verbose,
  port,
}: RegistryOptions): Promise<Partial<RegistryResult>> {
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
        onComplete: code => {
          console.info('local registry onComplete', code);
        },
      },
    }).catch(error => {
      if (error.message !== 'Failed to start verdaccio: undefined') {
        reject(error);
      }
    });
  });
}
