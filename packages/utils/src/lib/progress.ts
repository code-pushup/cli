import chalk from 'chalk';
import { MultiProgressBars, UpdateOptions } from 'multi-progress-bars';

let mpb: MultiProgressBars;

export function getProgress(taskName: string) {
  // Initialize mpb
  if (!mpb) {
    mpb = new MultiProgressBars({
      initMessage: '',
      border: true,
    });
  }

  if (mpb.getIndex(taskName) === undefined) {
    // Add tasks
    mpb.addTask(taskName, {
      type: 'percentage',
      percentage: 0,
    });
  }

  // Return Singleton

  return {
    updateTask(options: UpdateOptions) {
      mpb.updateTask(taskName, options);
    },
    incrementTask(options: UpdateOptions) {
      mpb.incrementTask(taskName, options);
    },
    // @TODO evaluate better implementation and read the docs wht it really does
    close: () => () => mpb.close,
  };
}

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
