import { Options } from 'yargs';

export const onlyPluginsOption: Options = {
  describe: 'List of plugins to run. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: (arg: string[]) => arg.flatMap(v => v.split(',')),
};

export function yargsOnlyPluginsOptionsDefinition(): Record<
  'onlyPlugins',
  Options
> {
  return {
    onlyPlugins: onlyPluginsOption,
  };
}
