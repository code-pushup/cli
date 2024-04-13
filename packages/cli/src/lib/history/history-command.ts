import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
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

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Collect reports for commit history',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      ui().logger.info(chalk.bold(CLI_NAME));
      ui().logger.info(chalk.gray(`Run ${command}`));

      const currentBranch = await getCurrentBranchOrTag();
      let {
        semverTag,
        targetBranch = currentBranch,
        forceCleanStatus,
        maxCount,
        from,
        to,
        ...restOptions
      } = args as unknown as HistoryCliOptions & HistoryOptions;

      // determine history to walk
      if(semverTag) {
        const tagHash = (await getSemverTags({ targetBranch })).find(({hash}) => hash === from)?.hash;
        if(tagHash == null) {
          ui().logger.info(`could not find hash for tag ${from}`)
        } else {
          from = tagHash;
        }
      }
      const results: LogResult[] = await getHashes({ targetBranch, from, to })
      //  semverTag ? await getSemverTags({ targetBranch, maxCount })
      //  : await getHashes({ targetBranch, maxCount, from, to });

       ui().logger.info(`Log ${chalk.bold(semverTag ? 'tags' : 'commits')} for branch ${chalk.bold(targetBranch)}:`)
      results.forEach(({hash, message, tagName}) => ui().logger.info(`${hash} - ${tagName ? tagName: message.slice(0,55)}`));

      // ui().logger.info(`Log ${chalk.bold(semverTag ? 'tags' : 'commits')} for branch ${chalk.bold(targetBranch)}:`)
      // commits.forEach(({hash, message, tagName}) => ui().logger.info(`${hash} - ${tagName ? tagName: message.slice(0,55)}`));
return;
      try {
        // run history logic
        const reports = await history(
          {
            ...restOptions,
            targetBranch,
            forceCleanStatus,
          },
          results.map(({ hash, tagName }) => tagName ?? hash),
        );

        ui().logger.log(`Reports: ${reports.length}`);
      } finally {
        // go back to initial branch
        await safeCheckout(currentBranch);
      }
    },
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
  } satisfies CommandModule;
}
