import chalk from 'chalk';
import {ArgumentsCamelCase, CommandModule} from 'yargs';
import {HistoryOptions, history} from '@code-pushup/core';
import {
    LogResult,
    getCurrentBranchOrTag,
    getHashes,
    getSemverTags,
    safeCheckout,
    ui,
  isSemver
} from '@code-pushup/utils';
import {CLI_NAME} from '../constants';
import {yargsOnlyPluginsOptionsDefinition} from '../implementation/only-plugins.options';
import {HistoryCliOptions} from './history.model';
import {yargsHistoryOptionsDefinition} from './history.options';

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
                maxCount = 0,
                from,
                to,
                ...restOptions
            } = args as unknown as HistoryCliOptions & HistoryOptions;

            // turn tags into hashes
          if (isSemver(from) || isSemver(to)) {
              const tags = (await getSemverTags({targetBranch}));
            //  ui().logger.log(JSON.stringify(tags))
              if (isSemver(from)) {
                    const tagHash = tags.find(({hash}) => hash === from)?.hash;
                    if (tagHash == null) {
                        ui().logger.info(`could not find hash for tag ${from}`)
                    } else {
                        from = tagHash;
                    }
                }
              if (isSemver(to)) {
                const tagHash = tags.find(({hash}) => hash === to)?.hash;
                if (tagHash == null) {
                  ui().logger.info(`could not find hash for tag ${to}`)
                } else {
                  to = tagHash;
                }
              }
            }


            const results: LogResult[] = semverTag ? await getSemverTags({ targetBranch, maxCount: maxCount && maxCount > 0 ? maxCount : undefined })
              : await getHashes({ targetBranch, from, to, maxCount: maxCount && maxCount > 0 ? maxCount : undefined });

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
