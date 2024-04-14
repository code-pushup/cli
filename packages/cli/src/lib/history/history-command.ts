import chalk from 'chalk';
import { CommandModule } from 'yargs';
import { HistoryOptions, history } from '@code-pushup/core';
import {
  LogResult,
  getCurrentBranchOrTag,
  getHashes,
  getSemverTags,
  safeCheckout,
  ui,
} from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';
import { HistoryCliOptions } from './history.model';
import { yargsHistoryOptionsDefinition } from './history.options';
import { normalizeHashOptions } from './utils';

const command = 'history';
async function handler(args: unknown) {
  ui().logger.info(chalk.bold(CLI_NAME));
  ui().logger.info(chalk.gray(`Run ${command}`));

  const currentBranch = await getCurrentBranchOrTag();
  const { targetBranch: rawTargetBranch, ...opt } = args as HistoryCliOptions &
    HistoryOptions;
  const { targetBranch, from, to, maxCount, semverTag, ...historyOptions } =
    await normalizeHashOptions({
      ...opt,
      targetBranch: rawTargetBranch ?? currentBranch,
    });

  const filterOptions = { targetBranch, from, to, maxCount };
  const results: LogResult[] = semverTag
    ? await getSemverTags(filterOptions)
    : await getHashes(filterOptions);

  ui().logger.info(
    `Log ${chalk.bold(semverTag ? 'tags' : 'commits')} for branch ${chalk.bold(
      targetBranch,
    )}:`,
  );
  results.forEach(({ hash, message }) => {
    ui().logger.info(`${hash} - ${message.slice(0, 100)}`);
  });

  try {
    // run history logic
    const reports = await history(
      {
        targetBranch,
        ...historyOptions,
      },
      results.map(({ hash }) => hash),
    );

    ui().logger.log(`Reports: ${reports.length}`);
  } finally {
    // go back to initial branch
    await safeCheckout(currentBranch);
  }
}

export function yargsHistoryCommandObject() {
  return {
    command,
    describe: 'Collect reports for commit history',
    builder: yargs => {
      yargs.options({
        ...yargsHistoryOptionsDefinition(),
        ...yargsOnlyPluginsOptionsDefinition(),
      });
      yargs.group(
        Object.keys(yargsHistoryOptionsDefinition()),
        'History Options:',
      );
      return yargs;
    },
    handler,
  } satisfies CommandModule;
}
