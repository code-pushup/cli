import ansis from 'ansis';
import type { CommandModule } from 'yargs';
import { type HistoryOptions, history } from '@code-pushup/core';
import {
  type LogResult,
  getCurrentBranchOrTag,
  getHashes,
  getSemverTags,
  logger,
  safeCheckout,
} from '@code-pushup/utils';
import { CLI_NAME } from '../constants.js';
import { yargsFilterOptionsDefinition } from '../implementation/filter.options.js';
import type { HistoryCliOptions } from './history.model.js';
import { yargsHistoryOptionsDefinition } from './history.options.js';
import { normalizeHashOptions } from './utils.js';

const command = 'history';
async function handler(args: unknown) {
  logger.info(ansis.bold(CLI_NAME));
  logger.debug(`Running ${ansis.bold(command)} command`);

  const currentBranch = await getCurrentBranchOrTag();
  const { targetBranch: rawTargetBranch, ...opt } = args as HistoryCliOptions &
    HistoryOptions;
  const {
    targetBranch,
    from,
    to,
    maxCount,
    onlySemverTags,
    ...historyOptions
  } = await normalizeHashOptions({
    ...opt,
    targetBranch: rawTargetBranch ?? currentBranch,
  });

  const filterOptions = { targetBranch, from, to, maxCount };
  const results: LogResult[] = onlySemverTags
    ? await getSemverTags(filterOptions)
    : await getHashes(filterOptions);

  try {
    // run history logic
    const reports = await history(
      {
        targetBranch,
        ...historyOptions,
      },
      results.map(({ hash }) => hash),
    );

    logger.info(`Reports: ${reports.length}`);
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
        ...yargsFilterOptionsDefinition(),
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
