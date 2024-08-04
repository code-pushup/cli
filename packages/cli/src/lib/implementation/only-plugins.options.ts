import { Options } from 'yargs';
import { coerceArray } from './global.utils';
import { OnlyPluginsCliOptions } from './only-plugins.model';

export const onlyPluginsOption: Options = {
  describe: 'List of plugins to run. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
};

export function yargsOnlyPluginsOptionsDefinition(): Record<
  keyof OnlyPluginsCliOptions,
  Options
> {
  return {
    onlyPlugins: onlyPluginsOption,
  };
}
