import ansis, { type AnsiColors } from 'ansis';
import { platform } from 'node:os';
import ora, { type Ora } from 'ora';
import { dateToUnixTimestamp } from './dates.js';
import { isEnvVarEnabled } from './env.js';
import { formatDuration } from './formatting.js';
import { settlePromise } from './promises.js';

type GroupColor = Extract<AnsiColors, 'cyan' | 'magenta'>;
type CiPlatform = 'GitHub Actions' | 'GitLab CI/CD';

const GROUP_COLOR_ENV_VAR_NAME = 'CP_LOGGER_GROUP_COLOR';

export class Logger {
  #isVerbose = isEnvVarEnabled('CP_VERBOSE');
  #isCI = isEnvVarEnabled('CI');
  #ciPlatform: CiPlatform | undefined =
    process.env['GITHUB_ACTIONS'] === 'true'
      ? 'GitHub Actions'
      : process.env['GITLAB_CI'] === 'true'
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
    process.exit(platform() === 'win32' ? 2 : 130);
  };

  error(message: string): void {
    this.#log(message, 'red');
  }

  warn(message: string): void {
    this.#log(message, 'yellow');
  }

  info(message: string): void {
    this.#log(message);
  }

  debug(message: string): void {
    if (this.#isVerbose) {
      this.#log(message, 'gray');
    }
  }

  newline(): void {
    this.#log('');
  }

  isVerbose(): boolean {
    return this.#isVerbose;
  }

  setVerbose(isVerbose: boolean): void {
    process.env['CP_VERBOSE'] = `${isVerbose}`;
    this.#isVerbose = isVerbose;
  }

  async group(title: string, worker: () => Promise<string>): Promise<void> {
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
          this.#colorize(`${result.reason}`, 'red'),
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

  task(title: string, worker: () => Promise<string>): Promise<void> {
    return this.#spinner(worker, {
      pending: title,
      success: value => value,
      failure: error => `${title} → ${ansis.red(`${error}`)}`,
    });
  }

  command(bin: string, worker: () => Promise<void>): Promise<void> {
    return this.#spinner(worker, {
      pending: `${ansis.blue('$')} ${bin}`,
      success: () => `${ansis.green('$')} ${bin}`,
      failure: () => `${ansis.red('$')} ${bin}`,
    });
  }

  async #spinner<T>(
    worker: () => Promise<T>,
    messages: {
      pending: string;
      success: (value: T) => string;
      failure: (error: unknown) => string;
    },
  ): Promise<void> {
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
        : messages.failure(result.reason);

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

    this.#activeSpinner = undefined;
    this.#activeSpinnerLogs.forEach(message => {
      this.#log(`  ${message}`);
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
        console.log(this.#format(`  ${message}`, color));
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
    return message
      .split(/\r?\n/)
      .map(line =>
        [
          this.#colorize('│', this.#groupColor),
          this.#colorize(line, color),
        ].join(' '),
      )
      .join('\n');
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
