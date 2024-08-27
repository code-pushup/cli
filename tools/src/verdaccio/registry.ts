import { executeProcess } from '@code-pushup/utils';
import { objectToCliArgs } from '../../../packages/nx-plugin';
// cant import from utils
import { teardownTestFolder } from '../../../testing/test-setup/src';
import { killProcesses, listProcess } from '../debug/utils';
import { START_VERDACCIO_SERVER_TARGET_NAME } from './constants';
import {bold, green, red} from "ansis";

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
  // reset or remove cached packages and/or metadata.
  clear: boolean;
};

export type NxStarVerdaccioOptions = VerdaccioExecuterOptions &
  NxStarVerdaccioOnlyOptions;

export async function nxStartVerdaccioServer({
  projectName = '',
  storage,
  port,
  location,
  clear,
  verbose = false,
}: NxStarVerdaccioOptions): Promise<RegistryResult> {
  let startDetected = false;

  const positionalArgs = [
    'exec',
    'nx',
    START_VERDACCIO_SERVER_TARGET_NAME,
    projectName ?? '',
    '--',
  ];
  const args = objectToCliArgs<
    Partial<
      VerdaccioExecuterOptions & { _: string[]; verbose: boolean; cwd: string }
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

  if (verbose) {
    console.info(`Start verdaccio with command: ${commandId}`);
  }

  return (
    new Promise<RegistryResult>((resolve, reject) => {
      executeProcess({
        command: 'npm',
        args,
        shell: true,
        observer: {
          onStdout: (stdout: string) => {
            if (verbose) {
              process.stdout.write(`${green('>')} ${green(bold('Verdaccio'))} ${stdout}`);
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
                  // this makes the process throw
                  killProcesses({ commandMatch: commandId });
                },
              };

              console.info(
                `Registry started on URL: ${result.registry.url}, with PID: ${
                  listProcess({ commandMatch: commandId }).at(0)?.pid
                }`,
              );
              if (verbose) {
                console.table(result);
              }

              resolve(result);
            }
          },
          onStderr: (stderr: string) => {
            if (verbose) {
              process.stdout.write(`${red('>')} ${red(bold('Verdaccio'))} ${stderr}`);
            }
          },
        },
      })
        // @TODO reconsider this error handling
        .catch(error => {
          if (error.message !== 'Failed to start verdaccio: undefined') {
            console.error(
              `Error starting ${projectName} verdaccio registry:\n${error}`,
            );
          } else {
            reject(error);
          }
        });
    })
      // in case the server dies unexpectedly clean folder
      .catch(() => teardownTestFolder(storage))
  );
}
