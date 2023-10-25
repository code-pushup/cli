import chalk from 'chalk';
import {
  AddOptions,
  MultiProgressBars,
  UpdateOptions,
} from 'multi-progress-bars';

// import chalk from 'chalk';

// Initialize mpb
let mpb: MultiProgressBars;

export function getProgress(taskName: string, options?: { progress: boolean }) {
  const { progress = true } = options || {};
  const runIfProgress = (fn: () => unknown) => {
    if (progress) {
      fn();
    }
  };
  // Initialize mpb
  if (!mpb) {
    mpb = new MultiProgressBars({
      initMessage: '',
      border: true,
    });
  }

  if (mpb.getIndex(taskName) === undefined) {
    runIfProgress(() => {
      // Add tasks
      mpb.addTask(taskName, {
        type: 'percentage',
        percentage: 0,
      });
    });
  }

  // Return Singleton

  return {
    updateTask(options: UpdateOptions) {
      runIfProgress(() => mpb.updateTask(taskName, options));
    },
    incrementTask(options: UpdateOptions) {
      runIfProgress(() => mpb.incrementTask(taskName, options));
    },
    // @TODO evaluate better implementation
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
