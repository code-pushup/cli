import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  type CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import { logger } from '@code-pushup/utils';
import {
  collectSuccessfulLog,
  printCliCommand,
  renderCategoriesHint,
  renderPortalHint,
  renderUploadHint,
} from '../implementation/logging.js';

export function yargsCollectCommandObject(): CommandModule {
  const command = 'collect';
  return {
    command,
    describe: 'Run plugins and collect results',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      printCliCommand(command);

      const options = args as unknown as CollectAndPersistReportsOptions;

      await collectAndPersistReports(options);
      collectSuccessfulLog();

      if (!options.categories?.length) {
        logger.newline();
        renderCategoriesHint();
      }

      const { upload } = args as unknown as Record<
        'upload',
        object | undefined
      >;
      logger.newline();
      if (upload) {
        renderUploadHint();
      } else {
        renderPortalHint();
      }
    },
  } satisfies CommandModule;
}
