import { cliui } from '@poppinss/cliui';
import chalk from 'chalk';

const isVerbose = process.argv.includes('--verbose');
const isCI = !!process.env.CI;

const ui = cliui();
const { logger } = ui;
const tasks = ui.tasks({ verbose: isVerbose || isCI });

console.info('\n' + chalk.bold.blueBright('<↗> Code PushUp CLI 0.1.0') + '\n');

await tasks
  .add('Load config and plugins', async () => {
    await sleep(100);
    return 'DONE - plugins: 2, audits: 17, categories: 3, upload: enabled';
  })
  .add('Execute plugins', async task => {
    const spinner = logger.await('Executing plugins', {
      suffix: 'ESLint, Lighthouse',
    });
    spinner.start();
    spinner.tap(line => {
      task.update(line);
    });

    spinner.update('Executing ESLint plugin', { suffix: '1/2' });
    await sleep(900);
    if (isVerbose) {
      task.update(
        logger.prepareSuccess(
          'Completed ESLint plugin run (12 audits in 903 ms)',
        ),
      );
    }

    spinner.update('Executing Lighthouse plugin', { suffix: '2/2' });
    await sleep(3000);
    if (isVerbose) {
      task.update(
        logger.prepareSuccess(
          'Completed Lighthouse plugin run (5 audits in 3.02 s)',
        ),
      );
    }

    spinner.stop();
    return 'DONE - ESLint: 12 audits in 903 ms, Lighthouse: 5 audits in 3.02 s';
  })
  .add('Create report files', async task => {
    const spinner = logger.await('Creating report files', {
      suffix: 'json, md',
    });
    spinner.start();
    spinner.tap(line => {
      task.update(line);
    });

    spinner.update('Looking up commit in Git');
    await sleep(100);
    if (isVerbose) {
      task.update(logger.prepareSuccess('Found commit "fix tests" (5a940e7)'));
    }

    spinner.update('Creating report.json');
    await sleep(50);
    if (isVerbose) {
      task.update(logger.prepareSuccess('Created report.json (12.7 kB)'));
    }

    spinner.update('Creating report.md');
    await sleep(150);
    if (isVerbose) {
      task.update(logger.prepareSuccess('Created report.md (301 kB)'));
    }

    spinner.stop();
    return 'DONE - .code-pushup/report.json (12.7 kB), .code-pushup/report.md (301 kB)';
  })
  .add('Upload report to portal', async task => {
    await sleep(800);
    return task.error(new Error('Authorization error: Invalid API key'));
  })
  .run();

console.info('\n');

// const table = ui.table();
// table
//   .head(['Task', 'Status', 'Duration'])
//   .row(['Load configuration and plugins', ui.colors.green('DONE'), '101 ms'])
//   .row(['Execute ESLint plugin', ui.colors.green('DONE'), '903 ms'])
//   .row(['Execute Lighthouse plugin', ui.colors.green('DONE'), '3.02 s'])
//   .row(['Create report files', ui.colors.green('DONE'), '201 ms'])
//   .row(['Upload report to portal', ui.colors.red('FAILED'), '805 ms'])
//   .render();

await import('./stdout-report-mock.mjs');

console.info('\n' + chalk.bold('Artifacts:'));
console.info('- ' + chalk.cyan('.code-pushup/report.json') + ' (12.7 kB)');
console.info('- ' + chalk.cyan('.code-pushup/report.md') + ' (301 kB)');

console.info('\n' + chalk.bold('Errors:'));
console.info(
  '- Upload report to portal => ' +
    chalk.red('Authorization error: Invalid API key'),
);

console.info('\nMade with ❤️ by Code PushUp');

// await step({
//   startText: 'Parsing configuration file',
//   endText: 'Parsed configuration file',
//   duration: 100,
// });

async function step({ startText, endText, duration }) {
  const loader = logger.await(startText);
  loader.start();
  await sleep(duration);
  loader.update(endText);
  loader.stop();
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
