import { filterItemRefsBy, toArray } from '@code-pushup/utils';
import { OnlyPluginsOptions } from './only-plugins.model';
import { validateOnlyPluginsOption } from './only-plugins.utils';

export function onlyPluginsMiddleware<T extends OnlyPluginsOptions>(
  processArgs: T,
): T {
  if (processArgs.onlyPlugins && processArgs.onlyPlugins.length > 0) {
    const { plugins, categories = [], onlyPlugins } = processArgs;

    validateOnlyPluginsOption(plugins, processArgs);

    const onlyPluginsSet = new Set(toArray(onlyPlugins));

    return {
      ...processArgs,
      plugins: plugins.filter(({ slug }) => onlyPluginsSet.has(slug)),
      categories: filterItemRefsBy(categories, ({ plugin }) =>
        onlyPluginsSet.has(plugin),
      ),
    };
  }

  return processArgs;
}
