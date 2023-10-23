import { AddOptions, MultiProgressBars } from 'multi-progress-bars';

// import chalk from 'chalk';

// Initialize mpb
let mpb: MultiProgressBars;

export function getProgress(
  taskName: string,
  options: AddOptions = { type: 'percentage' },
) {
  // Initialize mpb
  if (!mpb) {
    mpb = new MultiProgressBars({
      initMessage: ' $ Example Fullstack Build ',
      anchor: 'top',
      persist: true,
      border: true,
    });
  }
  // Add tasks
  mpb.addTask(taskName, options);
  // Wait for all tasks to finish
  mpb.promise;

  return mpb;
}
