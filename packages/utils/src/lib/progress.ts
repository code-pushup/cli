import chalk from 'chalk';
import { CtorOptions, MultiProgressBars } from 'multi-progress-bars';

/**
 * ANSI escape codes in terminal stdout:
 * - `\u001b[30m` black
 * - `\u001b[90m` gray
 * - `\u001b[32m` green
 * - `\u001b[39m` reset or default color
 */

export const barStyles = {
  active: (s: string) => chalk.green(s),
  done: (s: string) => chalk.gray(s),
  idle: (s: string) => chalk.gray(s),
};

export const messageStyles = {
  active: (s: string) => chalk.black(s),
  done: (s: string) => chalk.green(chalk.bold(s)),
  idle: (s: string) => chalk.gray(s),
};

export type ProgressBar = {
  // @TODO find better naming
  incrementInSteps: (numSteps: number) => void;
  updateTitle: (title: string) => void;
  endProgress: (message?: string) => void;
};

let mpb: MultiProgressBars;

export function getSingletonProgressBars(
  options?: Partial<CtorOptions>,
): MultiProgressBars {
  if (!mpb) {
    mpb = new MultiProgressBars({
      initMessage: '',
      border: true,
      ...options,
    });
  }
  return mpb;
}

export function getProgressBar(taskName: string): ProgressBar {
  const tasks = getSingletonProgressBars();

  // Initialize progress bar if not set
  tasks.addTask(taskName, {
    type: 'percentage',
    percentage: 0,
    message: '',
    barTransformFn: barStyles.idle,
  });

  return {
    incrementInSteps: (numPlugins: number) => {
      tasks.incrementTask(taskName, {
        percentage: 1 / numPlugins,
        barTransformFn: barStyles.active,
      });
    },
    updateTitle: (title: string) => {
      tasks.updateTask(taskName, {
        message: title,
        barTransformFn: barStyles.active,
      });
    },
    endProgress: (message = '') => {
      tasks.done(taskName, {
        message: messageStyles.done(message),
        barTransformFn: barStyles.done,
      });
    },
  };
}
