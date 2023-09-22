import { spawn } from 'child_process';

/**
 * Represents the process result.
 * @category Types
 * @public
 * @property {string} stdout - The stdout of the process.
 * @property {string} stderr - The stderr of the process.
 * @property {number | null} code - The exit code of the process.
 */
export type ProcessResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  date: string;
  duration: number;
};

/**
 * Error class for process errors.
 * Contains additional information about the process result.
 * @category Error
 * @public
 * @class
 * @extends Error
 * @example
 * const result = await executeProcess({})
 * .catch((error) => {
 *   if (error instanceof ProcessError) {
 *   console.error(error.code);
 *   console.error(error.stderr);
 *   console.error(error.stdout);
 *   }
 * });
 *
 */
export class ProcessError extends Error {
  code: number | null;
  stderr: string;
  stdout: string;

  constructor(result: ProcessResult) {
    super(result.stderr);
    this.code = result.code;
    this.stderr = result.stderr;
    this.stdout = result.stdout;
  }
}

/**
 * Process config object. Contains the command, args and observer.
 * @param cfg - process config object with command, args and observer (optional)
 * @category Types
 * @public
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
 * command: 'node',
 * args: ['--version']
 * };
 *
 * // npx command
 * const cfg = {
 * command: 'npx',
 * args: ['--version']
 *
 */
export type ProcessConfig = {
  command: string;
  args?: string[];
  observer?: ProcessObserver;
};

/**
 * Process observer object. Contains the next, error and complete function.
 * @category Types
 * @public
 * @property {function} next - The next function of the observer (optional).
 * @property {function} error - The error function of the observer (optional).
 * @property {function} complete - The complete function of the observer (optional).
 *
 * @example
 * const observer = {
 *  next: (stdout) => console.log(stdout)
 *  }
 */
export type ProcessObserver = {
  next?: (stdout: string) => void;
  error?: (error: ProcessError) => void;
  complete?: () => void;
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
 * console.log(result);
 *
 * // async process execution
 * const result = await executeProcess({
 *    command: 'node',
 *    args: ['download-data.js'],
 *    observer: {
 *      next: updateProgress,
 *      error: handleError,
 *      complete: cleanLogs,
 *    }
 * });
 *
 * console.log(result);
 *
 * @param cfg - see {@link ProcessConfig}
 */
export function executeProcess(cfg: ProcessConfig): Promise<ProcessResult> {
  const { observer } = cfg;
  const { next, error, complete } = observer || {};
  const date = new Date().toISOString();
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const process = spawn(cfg.command, cfg.args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', data => {
      stdout += data.toString();
      next?.(data);
    });

    process.stderr.on('data', data => {
      stderr += data.toString();
    });

    process.on('error', err => {
      stderr += err.toString();
    });

    process.on('close', code => {
      const stop = performance.now();
      const timings = { date, duration: Math.floor(stop - start) };
      if (code === 0) {
        complete?.();
        resolve({ code, stdout, stderr, ...timings });
      } else {
        const errorMsg = new ProcessError({ code, stdout, stderr, ...timings });
        error?.(errorMsg);
        reject(errorMsg);
      }
    });
  });
}

/**
 * Converts an object with different types of values into an array of command-line arguments.
 *
 * @example
 * const args = objectToProcessArgs({
 *   _: 'index.js', // index.js
 *   name: 'Juanita', // --name=Juanita
 *   interactive: false, // --no-interactive
 *   parallel: 5, // --parallel=5
 *   formats: ['json', 'md'] // --format=json --format=md
 * });
 */
export function objectToCliArgs(
  params: Record<string, number | string | boolean | string[]> | { _: string },
): string[] {
  return Object.entries(params).flatMap(([key, value]) => {
    if (key === '_') {
      return [value.toString()];
    }

    if (Array.isArray(value)) {
      return value.map(v => `--${key}="${v}"`);
    }

    if (typeof value === 'string') {
      return [`--${key}="${value}"`];
    }

    if (typeof value === 'number') {
      return [`--${key}=${value}`];
    }

    if (typeof value === 'boolean') {
      return [`--${value ? '' : 'no-'}${key}`];
    }

    throw new Error(`Unsupported type ${typeof value} for key ${key}`);
  });
}
