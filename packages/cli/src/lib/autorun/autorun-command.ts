import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectOptions,
  UploadOptions,
  collectAndPersistReports,
  upload,
} from '@code-pushup/core';
import { CLI_NAME } from '../constants';
import {
  logger,
  renderConfigureCategoriesHint,
  renderIntegratePortalHint,
} from '../implementation/logging';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';

type AutorunOptions = CollectOptions & UploadOptions;

export function yargsAutorunCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Shortcut for running collect followed by upload',
    builder: yargsOnlyPluginsOptionsDefinition(),
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      logger().log(chalk.bold(CLI_NAME));
      logger().info(chalk.gray(`Run ${command}...`));
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

      if (options.categories.length === 0) {
        renderConfigureCategoriesHint();
      }

      if (options.upload) {
        await upload(options);
      } else {
        logger().warning('Upload skipped because configuration is not set.');
        renderIntegratePortalHint();
      }
    },
  } satisfies CommandModule;
}
