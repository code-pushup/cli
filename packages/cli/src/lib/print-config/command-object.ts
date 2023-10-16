import { CommandModule } from 'yargs';

export function yargsConfigCommandObject() {
  return {
    command: 'print-config',
    describe: 'Print config',
    handler: args => {
      const { _, $0, ...cleanArgs } = args;
      console.log(JSON.stringify(cleanArgs, null, 2));
    },
  } satisfies CommandModule;
}
