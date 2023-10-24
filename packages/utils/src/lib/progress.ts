import { AddOptions, MultiProgressBars } from 'multi-progress-bars';

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
      anchor: 'top',
      persist: true,
      border: true,
    });
  }
  // Add tasks
  mpb.addTask(taskName, options);

  return mpb;
}
