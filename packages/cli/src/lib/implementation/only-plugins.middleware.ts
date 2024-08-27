import { filterItemRefsBy } from '@code-pushup/utils';
import type { OnlyPluginsOptions } from './only-plugins.model';
import { validatePluginFilterOption } from './validate-plugin-filter-options.utils';

export function onlyPluginsMiddleware<T extends OnlyPluginsOptions>(
  originalProcessArgs: T,
): T {
  const { categories = [], onlyPlugins: originalOnlyPlugins } =
    originalProcessArgs;

  if (originalOnlyPlugins && originalOnlyPlugins.length > 0) {
    const { verbose, plugins, onlyPlugins = [] } = originalProcessArgs;

    validatePluginFilterOption(
      'onlyPlugins',
      { plugins, categories },
      { pluginsToFilter: onlyPlugins, verbose },
    );

    const validOnlyPlugins = onlyPlugins.filter(oP =>
      plugins.find(p => p.slug === oP),
    );
    const onlyPluginsSet = new Set(validOnlyPlugins);

    return {
      ...originalProcessArgs,
      plugins:
        onlyPluginsSet.size > 0
          ? plugins.filter(({ slug }) => onlyPluginsSet.has(slug))
          : plugins,
      categories:
        onlyPluginsSet.size > 0
          ? filterItemRefsBy(categories, ({ plugin }) =>
              onlyPluginsSet.has(plugin),
            )
          : categories,
    };
  }

  return {
    ...originalProcessArgs,
    // if undefined fill categories with empty array
    categories,
  };
}
