import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule, MiddlewareFunction } from 'yargs';
import { HistoryOptions, history } from '@code-pushup/core';
import {
  LogResult,
  getCurrentBranchOrTag,
  getHashFromTag,
  getHashes,
  getSemverTags,
  isSemver,
  safeCheckout,
  ui,
} from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';
import { historyMiddleware } from './history.middleware';
import { HistoryCliOptions } from './history.model';
import { yargsHistoryOptionsDefinition } from './history.options';

export async function normalizeHashOptions(
  opt: HistoryCliOptions,
): Promise<Pick<HistoryCliOptions, 'from' | 'to' | 'maxCount'>> {
  let { from, to, maxCount, semverTag, targetBranch } = opt;
  const tags = await getSemverTags({ targetBranch });
  if (semverTag) {
    if (from && !isSemver(from)) {
      // @TODO get tag from hash?
    }
    if (to && !isSemver(to)) {
      // @TODO get tag from hash?
    }
  } else {
    if (from && isSemver(from)) {
      const { hash } = await getHashFromTag(from);
      from = hash;
    }
    if (to && isSemver(to)) {
      const { hash } = await getHashFromTag(to);
      to = hash;
    }
  }

  return {
    from,
    to,
    maxCount: maxCount && maxCount > 0 ? maxCount : undefined,
  };
}

export function yargsHistoryCommandObject() {
  const command = 'history';
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
      yargs.middleware(historyMiddleware as MiddlewareFunction);
      return yargs;
    },
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      ui().logger.info(chalk.bold(CLI_NAME));
      ui().logger.info(chalk.gray(`Run ${command}`));

      const currentBranch = await getCurrentBranchOrTag();
      let {
        targetBranch,
        from,
        to,
        maxCount,
        semverTag,
        forceCleanStatus,
        ...historyOptions
      } = args as unknown as HistoryCliOptions & HistoryOptions;

      const filterOptions = { targetBranch, from, to, maxCount };
      const results: LogResult[] = semverTag
        ? await getSemverTags(filterOptions)
        : await getHashes(filterOptions);

      ui().logger.info(
        `Log ${chalk.bold(
          semverTag ? 'tags' : 'commits',
        )} for branch ${chalk.bold(targetBranch)}:`,
      );
      results.forEach(({ hash, message }) =>
        ui().logger.info(`${hash} - ${message.slice(0, 85)}`),
      );

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
    },
  } satisfies CommandModule;
}
