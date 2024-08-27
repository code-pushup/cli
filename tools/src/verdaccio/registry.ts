import { ConfigYaml } from '@verdaccio/types/build/configuration';
import { executeProcess, objectToCliArgs } from '@code-pushup/utils';
import { teardownTestFolder } from '../../../testing/test-setup/src';
import { killProcesses, listProcess } from '../debug/utils';
import { START_VERDACCIO_SERVER_TARGET_NAME } from './constants';

export function uniquePort(): number {
  return Number((6000 + Number(Math.random() * 1000)).toFixed(0));
}

export type RegistryServer = {
  protocol: string;
  port: string | number;
  host: string;
  urlNoProtocol: string;
  url: string;
};
export type Registry = RegistryServer &
  Required<Pick<VerdaccioExecuterOptions, 'storage'>>;

export type RegistryResult = {
  registry: Registry;
  stop: () => void;
};

export function parseRegistryData(stdout: string): RegistryServer {
  const output = stdout.toString();

  // Extract protocol, host, and port
  const match = output.match(
    /(?<proto>https?):\/\/(?<host>[^:]+):(?<port>\d+)/,
  );

  if (!match?.groups) {
    throw new Error('Could not parse registry data from stdout');
  }

  const protocol = match.groups['proto'];
  if (!protocol || !['http', 'https'].includes(protocol)) {
    throw new Error(
      `Invalid protocol ${protocol}. Only http and https are allowed.`,
    );
  }
  const host = match.groups['host'];
  if (!host) {
    throw new Error(`Invalid host ${String(host)}.`);
  }
  const port = !Number.isNaN(Number(match.groups['port']))
    ? Number(match.groups['port'])
    : undefined;
  if (!port) {
    throw new Error(`Invalid port ${String(port)}.`);
  }
  return {
    protocol,
    host,
    port,
    urlNoProtocol: `//${host}:${port}`,
    url: `${protocol}://${host}:${port}`,
  };
}

export type NxStarVerdaccioOnlyOptions = {
  projectName?: string;
  verbose?: boolean;
};

export type VerdaccioExecuterOptions = {
  storage?: string;
  port?: string;
  p?: string;
  config?: string;
  c?: string;
  location: string;
  // reset or remove cached packages and or metadata.
  clear: boolean;
};

export type NxStarVerdaccioOptions = VerdaccioExecuterOptions &
  NxStarVerdaccioOnlyOptions;

export function nxStartVerdaccioServer({
  projectName = '',
  storage,
  port,
  location,
  clear,
  verbose = false,
}: NxStarVerdaccioOptions): Promise<RegistryResult> {
  let startDetected = false;

  return new Promise((resolve, reject) => {
    const positionalArgs = [
      'exec',
      'nx',
      START_VERDACCIO_SERVER_TARGET_NAME,
      projectName ?? '',
      '--',
    ];
    const args = objectToCliArgs<
      Partial<
        VerdaccioExecuterOptions &
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
        onStdout: (stdout: string) => {
          if (verbose) {
            process.stdout.write(stdout);
          }

          // Log of interest: warn --- http address - http://localhost:<PORT-NUMBER>/ - verdaccio/5.31.1
          if (!startDetected && stdout.includes('http://localhost:')) {
            // only setup env one time
            startDetected = true;

            const result: RegistryResult = {
              registry: {
                storage,
                ...parseRegistryData(stdout),
              },
              // https://verdaccio.org/docs/cli/#default-database-file-location
              stop: () => {
                teardownTestFolder(storage);
                // this makes the process throw
                killProcesses({ commandMatch: commandId });
              },
            };

            console.info(
              `Registry started on URL: ${result.registry.url}, with PID: ${
                listProcess({ commandMatch: commandId }).at(0)?.pid
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
    })
      // @TODO reconsider this error handling
      .catch(error => {
        if (error.message !== 'Failed to start verdaccio: undefined') {
          console.error(
            `Error starting ${projectName} verdaccio registry:\n${
              error as Error
            }`,
          );
          reject(error);
        }
        teardownTestFolder(storage);
        throw error;
      });
  });
}
