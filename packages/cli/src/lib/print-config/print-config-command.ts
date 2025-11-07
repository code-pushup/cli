import ansis from 'ansis';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CommandModule } from 'yargs';
import { logger } from '@code-pushup/utils';
import { filterKebabCaseKeys } from '../implementation/global.utils.js';
import type { PrintConfigOptions } from '../implementation/print-config.model.js';
import { yargsPrintConfigOptionsDefinition } from '../implementation/print-config.options.js';

export function yargsPrintConfigCommandObject() {
  const command = 'print-config';
  return {
    command,
    describe: 'Print config',
    builder: yargsPrintConfigOptionsDefinition(),
    handler: async yargsArgs => {
      // it is important to filter out kebab case keys
      // because yargs duplicates options in camel case and kebab case
      const { _, $0, ...args } = filterKebabCaseKeys(yargsArgs);
      const { output, ...config } = args as PrintConfigOptions &
        Record<string, unknown>;

      const content = JSON.stringify(config, null, 2);

      if (output) {
        await mkdir(path.dirname(output), { recursive: true });
        await writeFile(output, content);
        logger.info(`Config printed to file ${ansis.bold(output)}`);
      } else {
        logger.info(content);
      }
    },
  } satisfies CommandModule;
}
