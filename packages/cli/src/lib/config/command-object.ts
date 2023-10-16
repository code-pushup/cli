import { CommandModule } from 'yargs';

export function yargsConfigCommandObject() {
  return {
    command: 'config',
    describe: 'Print config',
    handler: args => {
      console.log(JSON.stringify(args, null, 2));
    },
  } satisfies CommandModule;
}
