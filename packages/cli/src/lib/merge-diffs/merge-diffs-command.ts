import ansis from 'ansis';
import type { CommandModule } from 'yargs';
import { mergeDiffs } from '@code-pushup/core';
import type { PersistConfig } from '@code-pushup/models';
import { logger, profiler } from '@code-pushup/utils';
import { printCliCommand } from '../implementation/logging.js';
import type { MergeDiffsOptions } from '../implementation/merge-diffs.model.js';
import { yargsMergeDiffsOptionsDefinition } from '../implementation/merge-diffs.options.js';

export function yargsMergeDiffsCommandObject() {
  const command = 'merge-diffs';
  return {
    command,
    describe: 'Combine many report diffs into a single diff file',
    builder: yargsMergeDiffsOptionsDefinition(),
    handler: async (args: unknown) => {
      return profiler.measureAsync(
        'cli:command-merge-diffs',
        async () => {
          printCliCommand(command);

          const options = args as MergeDiffsOptions & {
            persist: Required<PersistConfig>;
          };
          const { files, persist } = options;

          const outputPath = await mergeDiffs(files, persist);

          logger.info(`Reports diff written to ${ansis.bold(outputPath)}`);
        },
        {
          success: (outputPath: string) => ({
            properties: [['Output Path', outputPath]],
            tooltipText: 'Merge-diffs command completed successfully',
          }),
        },
      );
    },
  } satisfies CommandModule;
}
