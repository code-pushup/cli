import { getProgress } from '../../../../dist/packages/utils/index.js';

const _arg = (name, fallback = '') =>
  process.argv
    .find(a => a.includes(`${name}=`))
    ?.split('=')
    ?.pop() || fallback;
const duration = parseInt(_arg('duration', '300'));
const plugins = parseInt(_arg('plugins', '10'));

/**
 * Custom runner implementation that simulates asynchronous situations.
 * It logs progress to the console with a configurable interval and defaults to 100ms.
 * The number of runs is also configurable and defaults to 4.
 * We can decide if the process should error or complete. By default, it completes.
 *
 * @arg duration: number - duration of plugin run in ms; defaults to 300
 * @arg plugins: number - number of updates; defaults to 4
 **/
(async () => {
  console.log(`progress:start with duration: ${duration}, plugins: ${plugins}`);
  const progress = getProgress('mock-progress');

  let i = 0;
  const id = setInterval(() => {
    if (i < plugins) {
      progress.incrementTask({ percentage: 1 / plugins });
    } else {
      clearInterval(id);
      progress.close();
    }
    i++;
  }, duration);
})();
