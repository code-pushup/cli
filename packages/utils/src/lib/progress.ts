import ansis from 'ansis';
import { type CtorOptions, MultiProgressBars } from 'multi-progress-bars';
import { TERMINAL_WIDTH } from './text-formats/constants.js';

type BarStyles = 'active' | 'done' | 'idle';
type StatusStyles = Record<BarStyles, (s: string) => string>;
export const barStyles: StatusStyles = {
  active: (s: string) => ansis.green(s),
  done: (s: string) => ansis.gray(s),
  idle: (s: string) => ansis.gray(s),
};

export const messageStyles: StatusStyles = {
  active: (s: string) => ansis.black(s),
  done: (s: string) => ansis.bold.green(s),
  idle: (s: string) => ansis.gray(s),
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
