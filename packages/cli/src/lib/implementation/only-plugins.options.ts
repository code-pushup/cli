import { Options } from 'yargs';
import { coerceArray } from './global.utils';

export const onlyPluginsOption: Options = {
  describe: 'List of plugins to run. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
};

export function yargsOnlyPluginsOptionsDefinition(): Record<
  'onlyPlugins',
  Options
> {
  return {
    onlyPlugins: onlyPluginsOption,
  };
}
