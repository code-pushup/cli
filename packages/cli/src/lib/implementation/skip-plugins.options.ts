import type { Options } from 'yargs';
import { coerceArray } from './global.utils';
import type { SkipPluginsCliOptions } from './skip-plugins.model';

export const skipPluginsOption: Options = {
  describe: 'List of plugins to skip. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
  alias: 'P',
};

export function yargsSkipPluginsOptionsDefinition(): Record<
  keyof SkipPluginsCliOptions,
  Options
> {
  return {
    skipPlugins: skipPluginsOption,
  };
}
