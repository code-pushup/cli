import type { Options } from 'yargs';
import type { FilterCliOptions } from './filter.model';
import { coerceArray } from './global.utils';

export const skipCategoriesOption: Options = {
  describe: 'List of categories to skip. If not set all categories are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
};

export const onlyCategoriesOption: Options = {
  describe: 'List of categories to run. If not set all categories are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
};

export const skipPluginsOption: Options = {
  describe: 'List of plugins to skip. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
  alias: 'P',
};

export const onlyPluginsOption: Options = {
  describe: 'List of plugins to run. If not set all plugins are run.',
  type: 'array',
  default: [],
  coerce: coerceArray,
  alias: 'p',
};

export function yargsFilterOptionsDefinition(): Record<
  keyof FilterCliOptions,
  Options
> {
  return {
    skipCategories: skipCategoriesOption,
    onlyCategories: onlyCategoriesOption,
    skipPlugins: skipPluginsOption,
    onlyPlugins: onlyPluginsOption,
  };
}
