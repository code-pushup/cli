import { CategoryRef } from '@code-pushup/models';
import { filterBy, filterItemsWithRefBy, toArray } from '@code-pushup/utils';
import { OnlyPluginsOptions } from './only-plugins.model';
import { validateOnlyPluginsOption } from './only-plugins.utils';

export function onlyPluginsMiddleware<T extends OnlyPluginsOptions>(
  processArgs: T,
): T {
  validateOnlyPluginsOption(processArgs.plugins, processArgs);

  if (processArgs.onlyPlugins) {
    const onlyPlugins = new Set(toArray(processArgs.onlyPlugins));
    const filteredPlugins = filterBy(processArgs.plugins, ({ slug }) =>
      onlyPlugins.has(slug),
    );
    return {
      ...processArgs,
      plugins: filteredPlugins,
      categories: filterItemsWithRefBy<CategoryRef>(
        processArgs.categories,
        ({ plugin }) => onlyPlugins.has(plugin),
      ),
    };
  }

  return processArgs;
}
