import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  type CollectOptions,
  type UploadOptions,
  collectAndPersistReports,
  upload,
} from '@code-pushup/core';
import { logger, profiler } from '@code-pushup/utils';
import {
  printCliCommand,
  renderCategoriesHint,
  renderPortalHint,
} from '../implementation/logging.js';

type AutorunOptions = CollectOptions & UploadOptions;

export function yargsAutorunCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Shortcut for running collect followed by upload',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      return profiler.span('autorun', async () => {
        printCliCommand(command);

        const options = args as unknown as AutorunOptions;

        // we need to ensure `json` is part of the formats as we want to upload
        const optionsWithFormat: AutorunOptions = {
          ...options,
          persist: {
            ...options.persist,
            format: [
              ...new Set([...options.persist.format, 'json']),
            ] as AutorunOptions['persist']['format'],
          },
        };

        await collectAndPersistReports(optionsWithFormat);

        if (!options.categories?.length) {
          renderCategoriesHint();
          logger.newline();
        }

        if (options.upload) {
          await upload(options);
        } else {
          logger.warn('Upload skipped because Portal is not configured.');
          logger.newline();
          renderPortalHint();
        }
      });
    },
  } satisfies CommandModule;
}
