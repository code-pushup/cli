import ansis from 'ansis';
import {
  type ChildProcess,
  type ChildProcessByStdio,
  type SpawnOptionsWithStdioTuple,
  type StdioPipe,
  spawn,
} from 'node:child_process';
import type { Readable, Writable } from 'node:stream';
import { logger } from './logger.js';

/**
 * Represents the process result.
 */
export type ProcessResult = {
  /** The full command with args that was executed. */
  bin: string;
  /** The exit code of the process (`null` if terminated by signal). */
  code: number | null;
  /** The signal which terminated the process, if any. */
  signal: NodeJS.Signals | null;
  /** The standard output from the process. */
  stdout: string;
  /** The standard error from the process. */
  stderr: string;
};

/**
 * Error class for process errors.
 * Contains additional information about the process result.
 * @example
 * const result = await executeProcess({}).catch((error) => {
 *   if (error instanceof ProcessError) {
 *     console.error(error.code);
 *     console.error(error.stderr);
 *     console.error(error.stdout);
 *   }
 * });
 *
 */
export class ProcessError extends Error {
  code: number | null;
  stderr: string;
  stdout: string;

  constructor(result: ProcessResult) {
    const message = result.signal
      ? `Process ${ansis.bold(result.bin)} terminated by ${result.signal}`
      : `Process ${ansis.bold(result.bin)} failed with exit code ${result.code}`;
    super(message);
    this.code = result.code;
    this.stderr = result.stderr;
    this.stdout = result.stdout;
  }
}

/**
 * Process config object. Contains the command, args and observer.
 * @param cfg Process config object with command, args and observer (optional)
 * @property {string} command - The command to execute.
 * @property {string[]} args - The arguments for the command.
 * @property {ProcessObserver} observer - The observer for the process.
 *
 * @example
 *
 * // bash command
 * const cfg = {
 *   command: 'bash',
 *   args: ['-c', 'echo "hello world"']
 * };
 *
 * // node command
 * const cfg = {
 *  command: 'node',
 *  args: ['--version']
 * };
 *
 * // npx command
 * const cfg = {
 *   command: 'npx',
 *   args: ['--version']
 * };
 */
export type ProcessConfig = Omit<
  SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>,
  'stdio'
> & {
  command: string;
  args?: string[];
  observer?: ProcessObserver;
  ignoreExitCode?: boolean;
};

/**
 * Process observer object.
 *
 * @example
 * const observer = {
 *   onStdout: (stdout) => console.info(stdout)
 * }
 */
export type ProcessObserver = {
  /** Called when the `stdout` stream receives new data (optional). */
  onStdout?: (stdout: string, sourceProcess?: ChildProcess) => void;
  /** Called when the `stdout` stream receives new data (optional). */
  onStderr?: (stderr: string, sourceProcess?: ChildProcess) => void;
  /** Called when the process ends in an error (optional). */
  onError?: (error: ProcessError) => void;
  /** Called when the process ends successfully (optional). */
  onComplete?: () => void;
};

/**
 * Executes a process and returns a promise with the result as `ProcessResult`.
 *
 * @example
 *
 * // sync process execution
 * const result = await executeProcess({
 *  command: 'node',
 *  args: ['--version']
 * });
 *
 * console.info(result);
 *
 * // async process execution
 * const result = await executeProcess({
 *    command: 'node',
 *    args: ['download-data.js'],
 *    observer: {
 *      onStdout: updateProgress,
 *      error: handleError,
 *      complete: cleanLogs,
 *    }
 * });
 *
 * console.info(result);
 *
 * @param cfg - see {@link ProcessConfig}
 */
export function executeProcess(cfg: ProcessConfig): Promise<ProcessResult> {
  const { command, args, observer, ignoreExitCode = false, ...options } = cfg;
  const { onStdout, onStderr, onError, onComplete } = observer ?? {};

  const bin = [command, ...(args ?? [])].join(' ');

  return logger.command(
    bin,
    () =>
      new Promise((resolve, reject) => {
        const spawnedProcess = spawn(command, args ?? [], {
          // shell:true tells Windows to use shell command for spawning a child process
          // https://stackoverflow.com/questions/60386867/node-spawn-child-process-not-working-in-windows
          shell: true,
          windowsHide: true,
          ...options,
        }) as ChildProcessByStdio<Writable, Readable, Readable>;

        // eslint-disable-next-line functional/no-let
        let stdout = '';
        // eslint-disable-next-line functional/no-let
        let stderr = '';
        // eslint-disable-next-line functional/no-let
        let output = ''; // interleaved stdout and stderr

        spawnedProcess.stdout.on('data', (data: unknown) => {
          const message = String(data);
          stdout += message;
          output += message;
          onStdout?.(message, spawnedProcess);
        });

        spawnedProcess.stderr.on('data', (data: unknown) => {
          const message = String(data);
          stderr += message;
          output += message;
          onStderr?.(message, spawnedProcess);
        });

        spawnedProcess.on('error', error => {
          reject(error);
        });

        spawnedProcess.on('close', (code, signal) => {
          const result: ProcessResult = { bin, code, signal, stdout, stderr };
          if (code === 0 || ignoreExitCode) {
            logger.debug(output);
            onComplete?.();
            resolve(result);
          } else {
            // ensure stdout and stderr are logged to help debug failure
            logger.debug(output, { force: true });
            const error = new ProcessError(result);
            onError?.(error);
            reject(error);
          }
        });
      }),
  );
}
