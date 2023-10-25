import chalk from 'chalk';
import { CommandModule } from 'yargs';
import { CLI_NAME } from '../cli';

export function yargsConfigCommandObject() {
  const command = 'print-config';
  return {
    command,
    describe: 'Print config',
    handler: args => {
      console.log(chalk.bold(CLI_NAME));
      console.log(chalk.gray(`Run ${command}...`));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _, $0, ...cleanArgs } = args;
      console.log(JSON.stringify(cleanArgs, null, 2));
    },
  } satisfies CommandModule;
}
