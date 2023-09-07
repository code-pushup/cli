import { writeFileSync } from 'fs';

const interval = parseInt(process.argv[2] || 100);
let runs = parseInt(process.argv[3] || 4);
let throwError = process.argv[4] === '1';
let outputPath = process.argv[5] || './out-async-runner.json';

/**
 * Custom runner implementation that simulates asynchronous situations.
 * It logs progress to the console with a configurable interval and defaults to 100ms.
 * The number of runs is also configurable and defaults to 4.
 * We can decide if the process should error or complete. By default, it completes.
 *
 * @arg interval: number - interval of updates in ms; defaults to 100
 * @arg runs: number - number of updates; defaults to 4
 * @arg throwError: '1' | '0' - if the process completes or throws; defaults to '0'
 **/
(async () => {
  console.log(
    `process:start with interval: ${interval}, runs: ${runs}, throwError: ${throwError}, outputPath: ${outputPath}`,
  );
  await new Promise(resolve => {
    const id = setInterval(() => {
      if (runs === 0) {
        clearInterval(id);
        if (throwError) {
          throw new Error('dummy-error');
        } else {
          resolve('result');
        }
      } else {
        runs--;
        console.log('process:update');
      }
    }, interval);
  });

  console.log('process:complete');
  writeFileSync(outputPath, JSON.stringify({ audits: ['dummy-result'] }));
})();
