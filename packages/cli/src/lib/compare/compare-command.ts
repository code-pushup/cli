import { bold, gray } from 'ansis';
import { CommandModule } from 'yargs';
import { compareReportFiles } from '@code-pushup/core';
import { PersistConfig, UploadConfig } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { CompareOptions } from '../implementation/compare.model';
import { yargsCompareOptionsDefinition } from '../implementation/compare.options';

export function yargsCompareCommandObject() {
  const command = 'compare';
  return {
    command,
    describe: 'Compare 2 report files and create a diff file',
    builder: yargsCompareOptionsDefinition(),
    handler: async (args: unknown) => {
      ui().logger.log(bold(CLI_NAME));
      ui().logger.info(gray(`Run ${command}...`));

      const options = args as CompareOptions & {
        persist: Required<PersistConfig>;
        upload?: UploadConfig;
      };

      const { before, after, persist, upload } = options;

      const outputPaths = await compareReportFiles(
        { before, after },
        persist,
        upload,
      );

      ui().logger.info(
        `Reports diff written to ${outputPaths
          .map(path => bold(path))
          .join(' and ')}`,
      );
    },
  } satisfies CommandModule;
}
