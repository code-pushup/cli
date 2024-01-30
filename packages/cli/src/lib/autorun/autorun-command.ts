import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectOptions,
  UploadOptions,
  collectAndPersistReports,
  upload,
} from '@code-pushup/core';
import { CLI_NAME } from '../constants';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';

type AutorunOptions = CollectOptions & UploadOptions;

export function yargsAutorunCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Shortcut for running collect followed by upload',
    builder: yargsOnlyPluginsOptionsDefinition(),
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      console.info(chalk.bold(CLI_NAME));
      console.info(chalk.gray(`Run ${command}...`));
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

      if (options.upload) {
        await upload(options);
      } else {
        console.warn('Upload skipped because configuration is not set.');
        console.info(
          [
            '💡 Integrate the portal:',
            '- npx code-pushup upload - Run upload to upload the created report to the server',
            '  https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
            '- Portal Integration - https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
            '- Upload Command - https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
          ].join('\n'),
        );
      }
    },
  } satisfies CommandModule;
}
