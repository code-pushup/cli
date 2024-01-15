import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions, OnlyPluginsOptions } from './model';
import {
  filterCategoryByPlugins,
  filterPluginsByOnlyPluginsOption,
  validateOnlyPluginsOption,
} from './only-plugins.utils';

export function onlyPluginsMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig & OnlyPluginsOptions>,
>(processArgs: T) {
  const args = processArgs;
  const cliOptions = args as GeneralCliOptions &
    Required<CoreConfig> &
    OnlyPluginsOptions;

  validateOnlyPluginsOption(cliOptions.plugins, cliOptions);

  const parsedProcessArgs: CoreConfig & GeneralCliOptions & OnlyPluginsOptions =
    {
      ...cliOptions,
      plugins: filterPluginsByOnlyPluginsOption(cliOptions.plugins, cliOptions),
      categories: filterCategoryByPlugins(cliOptions.categories, cliOptions),
    };

  return parsedProcessArgs;
}
