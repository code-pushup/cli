import { CommandModule } from 'yargs';

export function yargsConfigCommandObject() {
  const command = 'print-config';
  return {
    command,
    describe: 'Print config',
    handler: args => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _, $0, ...cleanArgs } = args;
      console.log(JSON.stringify(cleanArgs, null, 2));
    },
  } satisfies CommandModule;
}
