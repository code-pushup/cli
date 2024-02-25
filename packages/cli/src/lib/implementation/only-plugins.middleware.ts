import {OnlyPluginsOptions} from './only-plugins.model';
import {validateOnlyPluginsOption} from './only-plugins.utils';
import {filterBy, filterItemRefsBy, toArray} from "@code-pushup/utils";

export function onlyPluginsMiddleware<T extends OnlyPluginsOptions>(
  processArgs: T,
): T {
  if (processArgs.onlyPlugins && processArgs.onlyPlugins.length > 0) {
    const {plugins, categories, ...rest} = processArgs;

    validateOnlyPluginsOption(plugins, processArgs);

    const onlyPluginsSet = new Set(toArray(processArgs.onlyPlugins));

    return {
      ...rest,
      plugins: filterBy(plugins, ({slug}) =>
        onlyPluginsSet.has(slug),
      ),
      categories: filterItemRefsBy(categories, ({plugin}) => onlyPluginsSet.has(plugin)),
    };
  }

  return processArgs;
}
