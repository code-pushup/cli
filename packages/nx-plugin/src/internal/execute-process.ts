import { gray } from 'ansis';
import { spawn } from 'node:child_process';
import { ui } from '@code-pushup/utils';
import { formatCommandLog } from '../executors/internal/cli.js';

export function calcDuration(start: number, stop?: number): number {
  return Math.round((stop ?? performance.now()) - start);
}

/**
 * Processes Node.js specific environment variables that can't be passed via NODE_OPTIONS.
 * Extracts flags like --import from NODE_OPTIONS and adds them directly to the command arguments.
 */
function processNodeOptions({
  command,
  args,
  env,
}: {
  command: string;
  args: string[];
  env?: Record<string, string>;
}): {
  processedCommand: string;
  processedArgs: string[];
  processedEnv?: Record<string, string>;
} {
  if (!env || command !== 'node') {
    return {
      processedCommand: command,
      processedArgs: args,
      processedEnv: env,
    };
  }

  const processedEnv = { ...env };
  const processedArgs = [...args];

  // Handle NODE_OPTIONS that contain flags not allowed in environment variables
  if (processedEnv.NODE_OPTIONS) {
    const nodeOptions = processedEnv.NODE_OPTIONS;

    // Extract --import flag which is not allowed in NODE_OPTIONS
    const importMatch = nodeOptions.match(/--import[=\s]+([^\s]+)/);
    if (importMatch) {
      // Add --import flag directly to node arguments
      processedArgs.unshift(`--import=${importMatch[1]}`);

      // Remove --import from NODE_OPTIONS
      processedEnv.NODE_OPTIONS = nodeOptions
        .replace(/--import[=\s]+[^\s]+/, '')
        .trim();

      // If NODE_OPTIONS is now empty, remove it entirely
      if (!processedEnv.NODE_OPTIONS) {
        delete processedEnv.NODE_OPTIONS;
      }
    }
  }

  return {
    processedCommand: command,
    processedArgs: processedArgs,
    processedEnv:
      Object.keys(processedEnv).length > 0 ? processedEnv : undefined,
  };
}

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
  cwd?: string;
  env?: Record<string, string>;
  observer?: ProcessObserver;
  dryRun?: boolean;
  ignoreExitCode?: boolean;
};

/**
 * Process observer object. Contains the onStdout, error and complete function.
 * @category Types
 * @public
 * @property {function} onStdout - The onStdout function of the observer (optional).
 * @property {function} onError - The error function of the observer (optional).
 * @property {function} onComplete - The complete function of the observer (optional).
 *
 * @example
 * const observer = {
 *  onStdout: (stdout) => console.info(stdout)
 *  }
 */
export type ProcessObserver = {
  onStdout?: (stdout: string) => void;
  onError?: (error: ProcessError) => void;
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
 *    args: ['download-data'],
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
  const {
    observer,
    cwd,
    command,
    args,
    ignoreExitCode = false,
    env,
    dryRun,
  } = cfg;
  const { onStdout, onError, onComplete } = observer ?? {};
  const date = new Date().toISOString();
  const start = performance.now();

  // Handle Node.js specific environment variables that can't be passed via NODE_OPTIONS
  const { processedCommand, processedArgs, processedEnv } = processNodeOptions({
    command,
    args: args ?? [],
    env,
  });

  ui().logger.log(
    gray(
      `Executing command:\n${formatCommandLog({
        command: processedCommand,
        args: processedArgs,
        env: processedEnv,
      })}\nIn working directory:\n${cfg.cwd ?? process.cwd()}`,
    ),
  );

  if (dryRun) {
    return Promise.resolve({
      code: 0,
      stdout: '@code-pushup executed in dry run mode',
      stderr: '',
      date,
      duration: calcDuration(start),
    });
  }

  return new Promise((resolve, reject) => {
    // shell:true tells Windows to use shell command for spawning a child process
    const process = spawn(processedCommand, processedArgs, {
      cwd,
      shell: true,
      env: processedEnv,
    });
    // eslint-disable-next-line functional/no-let
    let stdout = '';
    // eslint-disable-next-line functional/no-let
    let stderr = '';

    process.stdout.on('data', data => {
      stdout += String(data);
      onStdout?.(String(data));
    });

    process.stderr.on('data', data => {
      stderr += String(data);
    });

    process.on('error', err => {
      stderr += err.toString();
    });

    process.on('close', code => {
      const timings = { date, duration: calcDuration(start) };
      if (code === 0 || ignoreExitCode) {
        onComplete?.();
        resolve({ code, stdout, stderr, ...timings });
      } else {
        const errorMsg = new ProcessError({ code, stdout, stderr, ...timings });
        onError?.(errorMsg);
        reject(errorMsg);
      }
    });
  });
}
