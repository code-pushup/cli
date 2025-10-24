import ansis, { type AnsiColors } from 'ansis';
import os from 'node:os';
import ora, { type Ora } from 'ora';
import { dateToUnixTimestamp } from './dates.js';
import { isEnvVarEnabled } from './env.js';
import { stringifyError } from './errors.js';
import { formatDuration, indentLines, transformLines } from './formatting.js';
import { settlePromise } from './promises.js';

type GroupColor = Extract<AnsiColors, 'cyan' | 'magenta'>;
type CiPlatform = 'GitHub Actions' | 'GitLab CI/CD';

const GROUP_COLOR_ENV_VAR_NAME = 'CP_LOGGER_GROUP_COLOR';

/**
 * Rich logging implementation for Code PushUp CLI, plugins, etc.
 *
 * Use {@link logger} singleton.
 */
export class Logger {
  #isVerbose = isEnvVarEnabled('CP_VERBOSE');
  #isCI = isEnvVarEnabled('CI');
  #ciPlatform: CiPlatform | undefined = isEnvVarEnabled('GITHUB_ACTIONS')
    ? 'GitHub Actions'
    : isEnvVarEnabled('GITLAB_CI')
      ? 'GitLab CI/CD'
      : undefined;
  #groupColor: GroupColor | undefined =
    process.env[GROUP_COLOR_ENV_VAR_NAME] === 'cyan' ||
    process.env[GROUP_COLOR_ENV_VAR_NAME] === 'magenta'
      ? process.env[GROUP_COLOR_ENV_VAR_NAME]
      : undefined;

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
        this.#setGroupColor(undefined);
      } else {
        this.#activeSpinner.fail(text);
      }
      this.#activeSpinner = undefined;
    }
    this.newline();
    this.error(ansis.bold('Cancelled by SIGINT'));
    process.exit(os.platform() === 'win32' ? 2 : 130);
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
   */
  error(message: string): void {
    this.#log(message, 'red');
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
   */
  warn(message: string): void {
    this.#log(message, 'yellow');
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
   */
  info(message: string): void {
    this.#log(message);
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
   */
  debug(message: string): void {
    if (this.#isVerbose) {
      this.#log(message, 'gray');
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
  task(title: string, worker: () => Promise<string>): Promise<void> {
    return this.#spinner(worker, {
      pending: title,
      success: value => value,
      failure: error => `${title} → ${ansis.red(`${error}`)}`,
    });
  }

  /**
   * Similar to {@link task}, but spinner texts are formatted as shell commands.
   *
   * A `$`-prefix is added. Its color indicates the status (blue=pending, green=success, red=failure).
   *
   * @example
   * await logger.command('npx eslint . --format=json', async () => {
   *   // ...
   * });
   *
   * @param bin Command string with arguments.
   * @param worker Asynchronous execution of the command (not implemented by the logger).
   */
  command(bin: string, worker: () => Promise<void>): Promise<void> {
    return this.#spinner(worker, {
      pending: `${ansis.blue('$')} ${bin}`,
      success: () => `${ansis.green('$')} ${bin}`,
      failure: () => `${ansis.red('$')} ${bin}`,
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
   * await logger.group('Running plugin "ESLint"', async () => {
   *   logger.debug('ESLint version is 9.16.0');
   *   await logger.command('npx eslint . --format=json', () => {
   *     // ...
   *   })
   *   logger.info('Found 42 lint errors.');
   *   return 'Completed "ESLint" plugin execution';
   * });
   *
   * @param title Display title for the group.
   * @param worker Asynchronous implementation. Returned promise determines group status and ending message. Inner logs are attached to the group.
   */
  async group(title: string, worker: () => Promise<string>): Promise<void> {
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

    this.#setGroupColor(this.#groupsCount % 2 === 0 ? 'cyan' : 'magenta');
    this.#groupsCount++;

    const groupMarkers = this.#createGroupMarkers();

    console.log(groupMarkers.start(title));

    const start = performance.now();
    const result = await settlePromise(worker());
    const end = performance.now();

    if (result.status === 'fulfilled') {
      console.log(
        [
          this.#colorize(this.#groupSymbols.end, this.#groupColor),
          this.#colorize(result.value, 'green'),
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
    this.#setGroupColor(undefined);
    this.newline();

    if (result.status === 'rejected') {
      throw result.reason;
    }
  }

  #createGroupMarkers(): {
    start: (title: string) => string;
    end: () => string;
  } {
    switch (this.#ciPlatform) {
      case 'GitHub Actions':
        // https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#grouping-log-lines
        return {
          start: title =>
            `::group::${this.#formatGroupTitle(title, { prefix: false })}`,
          end: () => '::endgroup::',
        };
      case 'GitLab CI/CD':
        // https://docs.gitlab.com/ci/jobs/job_logs/#custom-collapsible-sections
        const ansiEscCode = '\x1b[0K'; // '\e' ESC character only works for `echo -e`, Node console must use '\x1b'
        const id = Math.random().toString(16).slice(2);
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

  #setGroupColor(groupColor: GroupColor | undefined) {
    this.#groupColor = groupColor;
    if (groupColor) {
      process.env[GROUP_COLOR_ENV_VAR_NAME] = groupColor;
    } else {
      delete process.env[GROUP_COLOR_ENV_VAR_NAME];
    }
  }

  async #spinner<T>(
    worker: () => Promise<T>,
    messages: {
      pending: string;
      success: (value: T) => string;
      failure: (error: unknown) => string;
    },
  ): Promise<void> {
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
      });
      if (this.#isCI) {
        console.log(this.#format(messages.pending, undefined));
      } else {
        this.#activeSpinner.start();
      }
    } else {
      this.#activeSpinner = ora(messages.pending);
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
  }

  #log(message: string, color?: AnsiColors): void {
    if (this.#activeSpinner) {
      if (this.#activeSpinner.isSpinning) {
        this.#activeSpinnerLogs.push(this.#format(message, color));
      } else {
        console.log(this.#format(indentLines(message, 2), color));
      }
    } else {
      console.log(this.#format(message, color));
    }
    this.#endsWithBlankLine = !message || message.endsWith('\n');
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
