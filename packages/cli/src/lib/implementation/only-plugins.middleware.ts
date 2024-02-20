import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';
import {
  filterCategoryByPluginSlug,
  filterPluginsBySlug,
  validateOnlyPluginsOption,
} from './only-plugins.utils';

export function onlyPluginsMiddleware<
  T extends GeneralCliOptions &
    Omit<CoreConfig, 'categories'> &
    Required<Pick<CoreConfig, 'categories'>> &
    OnlyPluginsOptions,
>(processArgs: T): GeneralCliOptions & CoreConfig & OnlyPluginsOptions {
  validateOnlyPluginsOption(processArgs.plugins, processArgs);

  return {
    ...processArgs,
    plugins: filterPluginsBySlug(processArgs.plugins, processArgs),
    categories: filterCategoryByPluginSlug(processArgs.categories, processArgs),
  };
}
