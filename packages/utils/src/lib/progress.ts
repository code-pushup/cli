import chalk from 'chalk';
import { MultiProgressBars } from 'multi-progress-bars';

const barStyles = {
  active: (s: string) => chalk.green(s),
  done: (s: string) => chalk.gray(s),
  idle: (s: string) => chalk.gray(s),
};

const messageStyles = {
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

export function getSingletonProgressBars(): MultiProgressBars {
  if (!mpb) {
    mpb = new MultiProgressBars({
      initMessage: '',
      border: true,
    });
  }
  return mpb;
}

export function getProgressBar(taskName: string): ProgressBar {
  const tasks = getSingletonProgressBars();

  // Initialize progress bar if not set
  if (tasks.getIndex(taskName) === undefined) {
    tasks.addTask(taskName, {
      type: 'percentage',
      percentage: 0,
    });
  }

  return {
    incrementInSteps: (numPlugins: number) => {
      tasks.incrementTask(taskName, {
        percentage: 1 / numPlugins,
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
