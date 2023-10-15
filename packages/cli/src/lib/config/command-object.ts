import { CommandModule } from 'yargs';

export function yargsConfigCommandObject() {
  return {
    command: 'config',
    describe: 'Print config',
    handler: args => {
      console.log('Config: ');
      console.log(args);
    },
  } satisfies CommandModule;
}
