import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'node:path';

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
let verbose = process.argv.find(arg => arg.includes('verbose')) ? true : false;
verbose = process.argv.find(arg => arg.includes('no-verbose='))
  ? false
  : verbose;
const duration = parseInt(
  process.argv
    .find(arg => arg.includes('duration='))
    ?.split('=')
    .pop() || '100',
);
let steps = parseInt(
  process.argv
    .find(arg => arg.includes('steps='))
    ?.split('=')
    .pop() || '4',
);
let throwError = parseInt(
  process.argv
    .find(arg => arg.includes('throwError='))
    ?.split('=')
    .pop() || '0',
);
let outputDir =
  process.argv
    .find(arg => arg.includes('outputDir='))
    ?.split('=')
    .pop() || './tmp';
let pluginPostfix =
  process.argv
    .find(arg => arg.includes('pluginPostfix='))
    ?.split('=')
    .pop() || '0';
let auditPostfix =
  process.argv
    .find(arg => arg.includes('auditPostfix='))
    ?.split('=')
    .pop() || '0';

const pluginSlug = 'progress-mock-plugin-' + pluginPostfix;
const auditSlug = pluginSlug + '-a' + auditPostfix;
const auditTitle = 'Async Audit ' + auditPostfix;
const outputFile = './' + path.join(outputDir, `${pluginSlug}-output.json`);

(async () => {
  if (verbose) {
    console.info('Plugin Progress Bar Mock - Async Plugin Process');
    console.info(`Duration: ${duration}`);
    console.info(`Steps: ${steps}`);
    console.error(`Throw Error: ${throwError}`);
    console.info(`Plugin Postfix: ${pluginPostfix} - Slug: ${pluginSlug}`);
    console.info(
      `Audit Postfix: ${auditPostfix} - Slug: ${auditSlug}; Title: ${auditTitle}`,
    );
    console.info(`Output Dir: ${outputDir} - Output File: ${outputFile}`);
    console.info('');
  }

  await new Promise(resolve => {
    verbose && console.info('--- plugin-process:start  ---');
    const id = setInterval(() => {
      if (steps === 0) {
        clearInterval(id);
        if (throwError) {
          throw new Error('dummy-error');
        } else {
          resolve('result');
        }
      } else {
        steps--;
        verbose && console.info(`--- plugin-process:update ${steps}  ---`);
      }
    }, duration);
  });

  verbose && console.info('--- plugin-process:complete ---');
  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      console.warn(e);
      throw e;
    }
  }
  writeFileSync(
    outputFile,
    JSON.stringify([
      {
        slug: auditSlug,
        title: auditTitle,
        value: Math.floor(Math.random() * 100, 0),
        score: Math.floor(Math.random(), 2),
      },
    ]),
  );
})();
