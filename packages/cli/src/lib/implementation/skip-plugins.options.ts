import { Options } from 'yargs';
import { coerceArray } from './global.utils';

export const skipPluginsOption: Options = {
  describe: 'List of plugins to skip. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
};

export function yargsSkipPluginsOptionsDefinition(): Record<
  'skipPlugins',
  Options
> {
  return {
    skipPlugins: skipPluginsOption,
  };
}
