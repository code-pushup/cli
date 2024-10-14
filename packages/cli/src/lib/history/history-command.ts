import { bold, gray } from 'ansis';
import type { CommandModule } from 'yargs';
import { type HistoryOptions, history } from '@code-pushup/core';
import {
  type LogResult,
  getCurrentBranchOrTag,
  getHashes,
  getSemverTags,
  safeCheckout,
  ui,
} from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { yargsFilterOptionsDefinition } from '../implementation/filter.options';
import type { HistoryCliOptions } from './history.model';
import { yargsHistoryOptionsDefinition } from './history.options';
import { normalizeHashOptions } from './utils';

const command = 'history';
async function handler(args: unknown) {
  ui().logger.info(bold(CLI_NAME));
  ui().logger.info(gray(`Run ${command}`));

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
