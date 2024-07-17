import { bold, gray } from 'ansis';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectOptions,
  UploadOptions,
  collectAndPersistReports,
  upload,
} from '@code-pushup/core';
import { ui } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import {
  collectSuccessfulLog,
  renderConfigureCategoriesHint,
  renderIntegratePortalHint,
  uploadSuccessfulLog,
} from '../implementation/logging';

type AutorunOptions = CollectOptions & UploadOptions;

export function yargsAutorunCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Shortcut for running collect followed by upload',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      ui().logger.log(bold(CLI_NAME));
      ui().logger.info(gray(`Run ${command}...`));
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
      collectSuccessfulLog();

      if (options.categories.length === 0) {
        renderConfigureCategoriesHint();
      }

      if (options.upload) {
        const { url } = await upload(options);
        uploadSuccessfulLog(url);
      } else {
        ui().logger.warning('Upload skipped because configuration is not set.');
        renderIntegratePortalHint();
      }
    },
  } satisfies CommandModule;
}
