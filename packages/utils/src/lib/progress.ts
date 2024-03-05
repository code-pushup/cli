import chalk from 'chalk';
import { CtorOptions, MultiProgressBars } from 'multi-progress-bars';
import { TERMINAL_WIDTH } from './reports/constants';

type BarStyles = 'active' | 'done' | 'idle';
type StatusStyles = Record<BarStyles, (s: string) => string>;
export const barStyles: StatusStyles = {
  active: (s: string) => chalk.green(s),
  done: (s: string) => chalk.gray(s),
  idle: (s: string) => chalk.gray(s),
};

export const messageStyles: StatusStyles = {
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

// eslint-disable-next-line functional/no-let
let mpb: MultiProgressBars;

export function getSingletonProgressBars(
  options?: Partial<CtorOptions>,
): MultiProgressBars {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!mpb) {
    mpb = new MultiProgressBars({
      progressWidth: TERMINAL_WIDTH,
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
