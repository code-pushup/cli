import chalk from 'chalk';
import {ArgumentsCamelCase, CommandModule} from 'yargs';
import {HistoryOptions, history} from '@code-pushup/core';
import {
  LogResult,
  getCurrentBranchOrTag,
  getHashes,
  getSemverTags,
  getHashFromTag,
  safeCheckout,
  ui,
  isSemver
} from '@code-pushup/utils';
import {CLI_NAME} from '../constants';
import {yargsOnlyPluginsOptionsDefinition} from '../implementation/only-plugins.options';
import {HistoryCliOptions} from './history.model';
import {yargsHistoryOptionsDefinition} from './history.options';

export async function normalizeHashOptions(opt: HistoryCliOptions): Promise<Pick<HistoryCliOptions, 'from' | 'to' | 'maxCount'>> {
  let {from, to, maxCount, semverTag, targetBranch} = opt;
  const tags = (await getSemverTags({targetBranch}));
  if (semverTag) {
    if (from && !isSemver(from)) {
      // @TODO get tag from hash?
    }
    if (to && !isSemver(to)) {
      // @TODO get tag from hash?
    }
  } else {
    if (from && isSemver(from)) {
      const {hash} = await getHashFromTag(from);
      from = hash;
    }
    if (to && isSemver(to)) {
      const {hash} = await getHashFromTag(to);
      to = hash;
    }
  }

  return {from, to, maxCount: maxCount && maxCount > 0 ? maxCount : undefined}
}

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
        ...restOptions
      } = args as unknown as HistoryCliOptions & HistoryOptions;

      // turn tags into hashes
      const filterOptions = await normalizeHashOptions({...restOptions, targetBranch});
      const results: LogResult[] = semverTag ?
        await getSemverTags({targetBranch, ...filterOptions}) :
        await getHashes({targetBranch,...filterOptions});

      ui().logger.info(`Log ${chalk.bold(semverTag ? 'tags' : 'commits')} for branch ${chalk.bold(targetBranch)}:`)
      results.forEach(({
                         hash,
                         message,
                         tagName
                       }) => ui().logger.info(`${hash} - ${tagName ? tagName : message.slice(0, 55)}`));

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
          results.map(({hash, tagName}) => tagName ?? hash),
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
