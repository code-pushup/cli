import { bold, gray } from 'ansis';
import { CommandModule } from 'yargs';
import { mergeDiffs } from '@code-pushup/core';
import { PersistConfig } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { MergeDiffsOptions } from '../implementation/merge-diffs.model';
import { yargsMergeDiffsOptionsDefinition } from '../implementation/merge-diffs.options';

export function yargsMergeDiffsCommandObject() {
  const command = 'merge-diffs';
  return {
    command,
    describe: 'Combine many report diffs into a single diff file',
    builder: yargsMergeDiffsOptionsDefinition(),
    handler: async (args: unknown) => {
      ui().logger.log(bold(CLI_NAME));
      ui().logger.info(gray(`Run ${command}...`));

      const options = args as MergeDiffsOptions & {
        persist: Required<PersistConfig>;
      };
      const { files, persist } = options;

      const outputPath = await mergeDiffs(files, persist);

      ui().logger.info(`Reports diff written to ${bold(outputPath)}`);
    },
  } satisfies CommandModule;
}
