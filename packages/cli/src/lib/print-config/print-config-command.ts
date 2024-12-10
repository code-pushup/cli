import type { CommandModule } from 'yargs';
import { ui } from '@code-pushup/utils';
import { filterKebabCaseKeys } from '../implementation/global.utils.js';

export function yargsConfigCommandObject() {
  const command = 'print-config';
  return {
    command,
    describe: 'Print config',
    handler: yargsArgs => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _, $0, ...args } = yargsArgs;
      // it is important to filter out kebab case keys
      // because yargs duplicates options in camel case and kebab case
      const cleanArgs = filterKebabCaseKeys(args);
      ui().logger.log(JSON.stringify(cleanArgs, null, 2));
    },
  } satisfies CommandModule;
}
