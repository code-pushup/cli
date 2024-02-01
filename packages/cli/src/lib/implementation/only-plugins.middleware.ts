import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';
import {
  filterCategoryByPluginSlug,
  filterPluginsBySlug,
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

  const parsedProcessArgs: Required<CoreConfig> &
    GeneralCliOptions &
    OnlyPluginsOptions = {
    ...cliOptions,
    plugins: filterPluginsBySlug(cliOptions.plugins, cliOptions),
    categories: filterCategoryByPluginSlug(cliOptions.categories, cliOptions),
  };

  return parsedProcessArgs;
}
