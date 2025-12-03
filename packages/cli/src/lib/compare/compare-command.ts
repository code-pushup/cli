import ansis from 'ansis';
import type { CommandModule } from 'yargs';
import { type CompareOptions, compareReportFiles } from '@code-pushup/core';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import { CLI_NAME } from '../constants.js';
import { yargsCompareOptionsDefinition } from '../implementation/compare.options.js';

export function yargsCompareCommandObject() {
  const command = 'compare';
  return {
    command,
    describe: 'Compare 2 report files and create a diff file',
    builder: yargsCompareOptionsDefinition(),
    handler: async (args: unknown) => {
      logger.info(ansis.bold(CLI_NAME));
      logger.debug(`Running ${ansis.bold(command)} command`);

      const options = args as CompareOptions & {
        persist: Required<PersistConfig>;
        upload?: UploadConfig;
      };

      const { before, after, label, persist, upload } = options;

      const outputPaths = await compareReportFiles(
        { persist, upload },
        { before, after, label },
      );

      logger.info(
        `Reports diff written to ${outputPaths
          .map(path => ansis.bold(path))
          .join(' and ')}`,
      );
    },
  } satisfies CommandModule;
}
