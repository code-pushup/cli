import ansis from 'ansis';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  type CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import {
  formatAsciiLink,
  formatAsciiSticker,
  logger,
} from '@code-pushup/utils';
import {
  collectSuccessfulLog,
  printCliCommand,
  renderConfigureCategoriesHint,
} from '../implementation/logging.js';

export function yargsCollectCommandObject(): CommandModule {
  const command = 'collect';
  return {
    command,
    describe: 'Run Plugins and collect results',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      printCliCommand(command);

      const options = args as unknown as CollectAndPersistReportsOptions;

      await collectAndPersistReports(options);
      collectSuccessfulLog();

      if (!options.categories || options.categories.length === 0) {
        renderConfigureCategoriesHint();
      }

      const { upload = {} } = args as unknown as Record<
        'upload',
        object | undefined
      >;
      if (Object.keys(upload).length === 0) {
        renderUploadAutorunHint();
      }
    },
  } satisfies CommandModule;
}

export function renderUploadAutorunHint(): void {
  logger.info(
    formatAsciiSticker([
      ansis.bold.gray('💡 Visualize your reports'),
      '',
      `${ansis.gray('❯')} npx code-pushup upload - ${ansis.gray(
        'Run upload to upload the created report to the server',
      )}`,
      `  ${formatAsciiLink(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
      `${ansis.gray('❯')} npx code-pushup autorun - ${ansis.gray('Run collect & upload')}`,
      `  ${formatAsciiLink(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#autorun-command',
      )}`,
    ]),
  );
}
