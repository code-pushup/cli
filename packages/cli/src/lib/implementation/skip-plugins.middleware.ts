import { filterItemRefsBy } from '@code-pushup/utils';
import type { SkipPluginsOptions } from './skip-plugins.model';
import { validatePluginFilterOption } from './validate-plugin-filter-options.utils';

export function skipPluginsMiddleware<T extends SkipPluginsOptions>(
  originalProcessArgs: T,
): T {
  const { categories = [], skipPlugins: originalSkipPlugins } =
    originalProcessArgs;

  if (originalSkipPlugins && originalSkipPlugins.length > 0) {
    const { verbose, plugins, skipPlugins = [] } = originalProcessArgs;

    validatePluginFilterOption(
      'skipPlugins',
      { plugins, categories },
      { pluginsToFilter: skipPlugins, verbose },
    );

    const validSkipPlugins = skipPlugins.filter(sP =>
      plugins.find(p => p.slug === sP),
    );

    const skipPluginsSet = new Set(validSkipPlugins);

    return {
      ...originalProcessArgs,
      plugins:
        skipPluginsSet.size > 0
          ? plugins.filter(({ slug }) => !skipPluginsSet.has(slug))
          : plugins,
      categories:
        skipPluginsSet.size > 0
          ? filterItemRefsBy(
              categories,
              ({ plugin }) => !skipPluginsSet.has(plugin),
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
