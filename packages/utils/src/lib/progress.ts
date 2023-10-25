import chalk from 'chalk';
import {
  AddOptions,
  MultiProgressBars,
  UpdateOptions,
} from 'multi-progress-bars';

// import chalk from 'chalk';

// Initialize mpb
let mpb: MultiProgressBars;

export type ProgressOptions = AddOptions;
export function getProgress(
  taskName: string,
  options: ProgressOptions = { type: 'percentage', percentage: 0 },
) {
  // Initialize mpb
  if (!mpb) {
    mpb = new MultiProgressBars({
      initMessage: '',
      border: true,
    });
  }

  if (mpb.getIndex(taskName) === undefined) {
    // Add tasks
    mpb.addTask(taskName, options);
  }

  // Return Singleton

  return {
    updateTask(options: UpdateOptions) {
      mpb.updateTask(taskName, options);
    },
    incrementTask(options: UpdateOptions) {
      mpb.updateTask(taskName, options);
    },
    close: mpb.close,
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
