import { CommandModule } from 'yargs';
import { filterKebabCaseKeys } from '../implementation/filter-kebab-case-keys';
import { onlyPluginsOption } from '../implementation/only-config-option';

export function yargsConfigCommandObject() {
  const command = 'print-config';
  return {
    command,
    describe: 'Print config',
    builder: {
      onlyPlugins: onlyPluginsOption,
    },
    handler: yargsArgs => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _, $0, ...args } = yargsArgs;
      // it is important to filter out kebab case keys
      // because yargs duplicates options in camel case and kebab case
      const cleanArgs = filterKebabCaseKeys(args);
      console.log(JSON.stringify(cleanArgs, null, 2));
    },
  } satisfies CommandModule;
}
