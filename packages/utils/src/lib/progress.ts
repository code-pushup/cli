import { AddOptions, MultiProgressBars } from 'multi-progress-bars';

// import chalk from 'chalk';

// Initialize mpb
let mpb: MultiProgressBars;

export type ProgressOptions = AddOptions;
export function getProgress(
  taskName: string,
  options: ProgressOptions = { type: 'percentage', percentage: 0 },
): MultiProgressBars {
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
  return mpb;
}
