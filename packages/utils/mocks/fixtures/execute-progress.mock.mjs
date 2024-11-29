import { bold, gray } from 'ansis';
import { getProgressBar } from '../../../../dist/packages/utils/index.js.js';

const _arg = (name, fallback = '') =>
  process.argv
    .find(a => a.includes(`${name}=`))
    ?.split('=')
    ?.pop() || fallback;
const duration = parseInt(_arg('duration', '300'));
const steps = parseInt(_arg('steps', '10'));
const verbose = Boolean(_arg('verbose', false));

/**
 * Custom runner implementation that simulates asynchronous situations.
 * It logs progress to the console with a configurable interval and defaults to 100ms.
 * The number of runs is also configurable and defaults to 4.
 * We can decide if the process should error or complete. By default, it completes.
 *
 * Usage:
 * nx build utils
 * npx node ./execute-progress.mock.mjs --verbose=1
 *
 * @arg duration: number - duration of plugin run in ms; defaults to 300
 * @arg steps: number - number of updates; defaults to 4
 * @arg steps: verbose - number 0 or 1 for more information
 **/
(async () => {
  verbose &&
    console.info(
      gray(
        `Start progress with duration: ${bold(duration)}, steps: ${bold(
          steps,
        )}`,
      ),
    );
  const progress = getProgressBar('mock-progress');

  let i = 0;
  const id = setInterval(() => {
    if (i < steps) {
      progress.incrementInSteps(steps);
      verbose && console.info('Step: ', i);
    } else {
      clearInterval(id);
      progress.endProgress();
    }
    i++;
  }, duration);
})();
