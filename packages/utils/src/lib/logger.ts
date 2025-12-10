/* eslint-disable max-lines, no-console, @typescript-eslint/class-methods-use-this */
import ansis, { type AnsiColors } from 'ansis';
import os from 'node:os';
import ora, { type Ora } from 'ora';
import { formatCommandStatus } from './command.js';
import { dateToUnixTimestamp } from './dates.js';
import { isEnvVarEnabled } from './env.js';
import { stringifyError } from './errors.js';
import { formatDuration, indentLines, transformLines } from './formatting.js';
import { settlePromise } from './promises.js';

type GroupColor = Extract<AnsiColors, 'cyan' | 'magenta'>;
type CiPlatform = 'GitHub' | 'GitLab';

/** Additional options for log methods */
export type LogOptions = {
  /** Do not append line-feed to message (`process.stdout.write` instead of `console.log`) */
  noLineBreak?: boolean;
  /** Do not indent lines even if logged while a spinner is active */
  noIndent?: boolean;
};

/** Additional options for {@link Logger.debug} method */
export type DebugLogOptions = LogOptions & {
  /** Print debug message even if verbose flag is not set */
  force?: boolean;
};

const HEX_RADIX = 16;

const SIGINT_CODE = 2;
// https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html#:~:text=When%20a%20command%20terminates%20on%20a%20fatal%20signal%20whose%20number%20is%20N%2C%20Bash%20uses%20the%20value%20128%2BN%20as%20the%20exit%20status.
const SIGNALS_CODE_OFFSET_UNIX = 128;
const SIGINT_EXIT_CODE_UNIX = SIGNALS_CODE_OFFSET_UNIX + SIGINT_CODE;
const SIGINT_EXIT_CODE_WINDOWS = SIGINT_CODE;

/**
 * Rich logging implementation for Code PushUp CLI, plugins, etc.
 *
 * Use {@link logger} singleton.
 */
export class Logger {
  #isVerbose = isEnvVarEnabled('CP_VERBOSE');
  #isCI = isEnvVarEnabled('CI');
  #ciPlatform: CiPlatform | undefined = isEnvVarEnabled('GITHUB_ACTIONS')
    ? 'GitHub'
    : isEnvVarEnabled('GITLAB_CI')
      ? 'GitLab'
      : undefined;
  #groupColor: GroupColor | undefined;

  #groupsCount = 0;
  #activeSpinner: Ora | undefined;
  #activeSpinnerLogs: string[] = [];
  #endsWithBlankLine = false;

  #groupSymbols = {
    start: '❯',
    middle: '│',
    end: '└',
  };

  #sigintListener = () => {
    if (this.#activeSpinner != null) {
      const text = `${this.#activeSpinner.text} ${ansis.red.bold('[SIGINT]')}`;
      if (this.#groupColor) {
        this.#activeSpinner.stopAndPersist({
          text,
          symbol: this.#colorize(this.#groupSymbols.end, this.#groupColor),
        });
        this.#groupColor = undefined;
      } else {
        this.#activeSpinner.fail(text);
      }
      this.#activeSpinner = undefined;
    }
    this.newline();
    this.error(ansis.bold('Cancelled by SIGINT'));
    // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
    process.exit(
      os.platform() === 'win32'
        ? SIGINT_EXIT_CODE_WINDOWS
        : SIGINT_EXIT_CODE_UNIX,
    );
  };

  /**
   * Logs an error to the console (red).
   *
   * Automatically adapts to logger state if called within {@link task}, {@link group}, etc.
   *
   * @example
   * logger.error('Config file is invalid');
   *
   * @param message Error text
   * @param options Additional options
   */
  error(message: string, options?: LogOptions): void {
    this.#log(message, 'red', options);
  }

  /**
   * Logs a warning to the console (yellow).
   *
   * Automatically adapts to logger state if called within {@link task}, {@link group}, etc.
   *
   * @example
   * logger.warn('Skipping invalid audits');
   *
   * @param message Warning text
   * @param options Additional options
   */
  warn(message: string, options?: LogOptions): void {
    this.#log(message, 'yellow', options);
  }

  /**
   * Logs an informational message to the console (unstyled).
   *
   * Automatically adapts to logger state if called within {@link task}, {@link group}, etc.
   *
   * @example
   * logger.info('Code PushUp CLI v0.80.2');
   *
   * @param message Info text
   * @param options Additional options
   */
  info(message: string, options?: LogOptions): void {
    this.#log(message, undefined, options);
  }

  /**
   * Logs a debug message to the console (gray), but **only if verbose** flag is set (see {@link isVerbose}).
   *
   * Automatically adapts to logger state if called within {@link task}, {@link group}, etc.
   *
   * @example
   * logger.debug('Running ESLint version 9.16.0');
   *
   * @param message Debug text
   * @param options Additional options
   */
  debug(message: string, options?: DebugLogOptions): void {
    if (this.#isVerbose || options?.force) {
      this.#log(message, 'gray', options);
    }
  }

  /**
   * Print a blank line to the console, used to separate logs for readability.
   *
   * Automatically adapts to logger state if called within {@link task}, {@link group}, etc.
   *
   * @example
   * logger.newline();
   */
  newline(): void {
    this.#log('');
  }

  /**
   * Is verbose flag set?
   *
   * Verbosity is configured by {@link setVerbose} call or `CP_VERBOSE` environment variable.
   *
   * @example
   * if (logger.isVerbose()) {
   *   // ...
   * }
   */
  isVerbose(): boolean {
    return this.#isVerbose;
  }

  /**
   * Sets verbose flag for this logger.
   *
   * Also sets the `CP_VERBOSE` environment variable.
   * This means any future {@link Logger} instantiations (including child processes) will use the same verbosity level.
   *
   * @example
   * logger.setVerbose(process.argv.includes('--verbose'));
   *
   * @param isVerbose Verbosity level
   */
  setVerbose(isVerbose: boolean): void {
    process.env['CP_VERBOSE'] = `${isVerbose}`;
    this.#isVerbose = isVerbose;
  }

  /**
   * Animates asynchronous work using a spinner.
   *
   * Basic logs are supported within the worker function, they will be printed with indentation once the spinner completes.
   *
   * In CI environments, the spinner animation is disabled, and inner logs are printed immediately.
   *
   * Spinners may be nested within a {@link group} call, in which case line symbols are used instead of dots, as well the group's color.
   *
   * The task's duration is included in the logged output as a suffix.
   *
   * Listens for `SIGINT` event in order to cancel and restore spinner before exiting.
   *
   * Concurrent or nested spinners are not supported, nor can groups be nested in spinners.
   *
   * @example
   * await logger.task('Uploading report to portal', async () => {
   *   // ...
   *   return 'Uploaded report to portal';
   * });
   *
   * @param title Display text used as pending message.
   * @param worker Asynchronous implementation. Returned promise determines spinner status and final message. Support for inner logs has some limitations (described above).
   */
  async task<T = undefined>(
    title: string,
    worker: () => Promise<string | { message: string; result: T }>,
  ): Promise<T> {
    const result = await this.#spinner(worker, {
      pending: title,
      success: value => (typeof value === 'string' ? value : value.message),
      failure: error => `${title} → ${ansis.red(String(error))}`,
    });
    return typeof result === 'object' ? result.result : (undefined as T);
  }

  /**
   * Similar to {@link task}, but spinner texts are formatted as shell commands.
   *
   * A `$`-prefix is added. Its color indicates the status (blue=pending, green=success, red=failure).
   *
   * If the command's working directory isn't `process.cwd()`, a relative path is prefixed to the output.
   *
   * @example
   * await logger.command('npx eslint . --format=json', async () => {
   *   // ...
   * });
   *
   * @param bin Command string with arguments.
   * @param worker Asynchronous execution of the command (not implemented by the logger).
   * @param options Custom CWD path where the command is executed (default is `process.cwd()`).
   * @template T Type of resolved worker value.
   */
  command<T>(
    bin: string,
    worker: () => Promise<T>,
    options?: {
      cwd?: string;
    },
  ): Promise<T> {
    return this.#spinner(worker, {
      pending: formatCommandStatus(bin, options, 'pending'),
      success: () => formatCommandStatus(bin, options, 'success'),
      failure: () => formatCommandStatus(bin, options, 'failure'),
    });
  }

  /**
   * Groups many logs into a visually distinct section.
   *
   * Groups alternate prefix colors between cyan and magenta.
   *
   * The group's total duration is included in the logged output.
   *
   * Nested groups are not supported.
   *
   * @example
   * const eslintResult = await logger.group('Running plugin "ESLint"', async () => {
   *   logger.debug('ESLint version is 9.16.0');
   *   const result = await logger.command('npx eslint . --format=json', () => {
   *     // ...
   *   })
   *   logger.info('Found 42 lint errors.');
   *   return {
   *     message: 'Completed "ESLint" plugin execution',
   *     result,
   *   };
   * });
   *
   * @param title Display title for the group.
   * @param worker Asynchronous implementation. Returned promise determines group status and ending message. Inner logs are attached to the group.
   */
  // eslint-disable-next-line max-lines-per-function
  async group<T = undefined>(
    title: string,
    worker: () => Promise<string | { message: string; result: T }>,
  ): Promise<T> {
    if (this.#groupColor) {
      throw new Error(
        'Internal Logger error - nested groups are not supported',
      );
    }
    if (this.#activeSpinner) {
      throw new Error(
        'Internal Logger error - creating group in active spinner is not supported',
      );
    }

    if (!this.#endsWithBlankLine) {
      this.newline();
    }

    this.#groupColor = this.#groupsCount % 2 === 0 ? 'cyan' : 'magenta';
    this.#groupsCount++;

    const groupMarkers = this.#createGroupMarkers();

    console.log(groupMarkers.start(title));

    const start = performance.now();
    const result = await settlePromise(worker());
    const end = performance.now();

    if (result.status === 'fulfilled') {
      const message =
        typeof result.value === 'string' ? result.value : result.value.message;
      console.log(
        [
          this.#colorize(this.#groupSymbols.end, this.#groupColor),
          this.#colorize(message, 'green'),
          this.#formatDurationSuffix({ start, end }),
        ].join(' '),
      );
    } else {
      console.log(
        [
          this.#colorize(this.#groupSymbols.end, this.#groupColor),
          this.#colorize(
            `${stringifyError(result.reason, { oneline: true })}`,
            'red',
          ),
        ].join(' '),
      );
    }

    const endMarker = groupMarkers.end();
    if (endMarker) {
      console.log(endMarker);
    }
    this.#groupColor = undefined;
    this.newline();

    if (result.status === 'rejected') {
      throw result.reason;
    }

    if (typeof result.value === 'object') {
      return result.value.result;
    }
    return undefined as T;
  }

  #createGroupMarkers(): {
    start: (title: string) => string;
    end: () => string;
  } {
    // Nx typically renders native log groups for each target in GitHub
    // + GitHub doesn't support nested log groups: https://github.com/actions/toolkit/issues/1001
    // => skip native GitHub log groups if run within Nx target
    const platform =
      this.#ciPlatform === 'GitHub' && process.env['NX_TASK_TARGET_TARGET'] // https://nx.dev/docs/reference/environment-variables
        ? undefined
        : this.#ciPlatform;

    switch (platform) {
      case 'GitHub':
        // https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#grouping-log-lines
        return {
          start: title =>
            `::group::${this.#formatGroupTitle(title, { prefix: false })}`,
          end: () => '::endgroup::',
        };
      case 'GitLab':
        // https://docs.gitlab.com/ci/jobs/job_logs/#custom-collapsible-sections
        const ansiEscCode = '\u001B[0K'; // '\e' ESC character only works for `echo -e`, Node console must use '\u001B'
        const id = Math.random().toString(HEX_RADIX).slice(2);
        const sectionId = `code_pushup_logs_group_${id}`;
        return {
          start: title => {
            const sectionHeader = this.#formatGroupTitle(title, {
              prefix: true,
            });
            const options = this.#isVerbose ? '' : '[collapsed=true]';
            // return `${ansiEscCode}section_start:${dateToUnixTimestamp(new Date())}:${sectionId}${options}${ansiEscCode}${sectionHeader}`;
            return `${ansiEscCode}section_start:${dateToUnixTimestamp(new Date())}:${sectionId}${options}\r${ansiEscCode}${sectionHeader}`;
          },
          end: () =>
            // `${ansiEscCode}section_end:${dateToUnixTimestamp(new Date())}:${sectionId}${ansiEscCode}`,
            `${ansiEscCode}section_end:${dateToUnixTimestamp(new Date())}:${sectionId}\r${ansiEscCode}`,
        };
      case undefined:
        return {
          start: title => this.#formatGroupTitle(title, { prefix: true }),
          end: () => '',
        };
    }
  }

  #formatGroupTitle(title: string, symbols: { prefix: boolean }): string {
    const text = symbols.prefix
      ? `${this.#groupSymbols.start} ${title}`
      : title;
    return ansis.bold(this.#colorize(text, this.#groupColor));
  }

  // eslint-disable-next-line max-lines-per-function
  async #spinner<T>(
    worker: () => Promise<T>,
    messages: {
      pending: string;
      success: (value: T) => string;
      failure: (error: unknown) => string;
    },
  ): Promise<T> {
    if (this.#activeSpinner) {
      throw new Error(
        'Internal Logger error - concurrent spinners are not supported',
      );
    }

    process.removeListener('SIGINT', this.#sigintListener);
    process.addListener('SIGINT', this.#sigintListener);

    if (this.#groupColor) {
      this.#activeSpinner = ora({
        text: messages.pending,
        spinner: 'line',
        color: this.#groupColor,
        stream: process.stdout,
      });
      if (this.#isCI) {
        console.log(this.#format(messages.pending, undefined));
      } else {
        this.#activeSpinner.start();
      }
    } else {
      this.#activeSpinner = ora({
        text: messages.pending,
        stream: process.stdout,
      });
      this.#activeSpinner.start();
    }

    this.#endsWithBlankLine = false;

    const start = performance.now();
    const result = await settlePromise(worker());
    const end = performance.now();

    const text =
      result.status === 'fulfilled'
        ? [
            messages.success(result.value),
            this.#formatDurationSuffix({ start, end }),
          ].join(' ')
        : messages.failure(stringifyError(result.reason, { oneline: true }));

    if (this.#activeSpinner) {
      if (this.#groupColor) {
        this.#activeSpinner.stopAndPersist({
          text,
          symbol: this.#colorize(this.#groupSymbols.middle, this.#groupColor),
        });
      } else {
        if (result.status === 'fulfilled') {
          this.#activeSpinner.succeed(text);
        } else {
          this.#activeSpinner.fail(text);
        }
      }
      this.#endsWithBlankLine = false;
    }

    this.#activeSpinner = undefined;
    this.#activeSpinnerLogs.forEach(message => {
      this.#log(indentLines(message, 2));
    });
    this.#activeSpinnerLogs = [];
    process.removeListener('SIGINT', this.#sigintListener);

    if (result.status === 'rejected') {
      throw result.reason;
    }

    return result.value;
  }

  #log(message: string, color?: AnsiColors, options?: LogOptions): void {
    const print: (text: string) => void = options?.noLineBreak
      ? text => process.stdout.write(text)
      : console.log;

    if (this.#activeSpinner) {
      if (this.#activeSpinner.isSpinning) {
        this.#activeSpinnerLogs.push(this.#format(message, color));
      } else {
        const indented =
          options?.noIndent || !message ? message : indentLines(message, 2);
        print(this.#format(indented, color));
      }
    } else {
      print(this.#format(message, color));
    }
    this.#endsWithBlankLine =
      (!message || message.endsWith('\n')) && !options?.noIndent;
  }

  #format(message: string, color: AnsiColors | undefined): string {
    if (!this.#groupColor || this.#activeSpinner?.isSpinning) {
      return this.#colorize(message, color);
    }
    return transformLines(
      message,
      line =>
        `${this.#colorize('│', this.#groupColor)} ${this.#colorize(line, color)}`,
    );
  }

  #colorize(text: string, color: AnsiColors | undefined): string {
    if (!color) {
      return text;
    }
    return ansis[color](text);
  }

  #formatDurationSuffix({
    start,
    end,
  }: {
    start: number;
    end: number;
  }): string {
    const duration = formatDuration(end - start);
    return ansis.gray(`(${duration})`);
  }
}

/**
 * Shared {@link Logger} instance.
 *
 * @example
 * import { logger } from '@code-pushup/utils';
 *
 * logger.info('Made with ❤️ by Code PushUp');
 */
export const logger = new Logger();
