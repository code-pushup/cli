import { filterItemRefsBy } from '@code-pushup/utils';
import { OnlyPluginsOptions } from './only-plugins.model';
import { validateOnlyPluginsOption } from './only-plugins.utils';

export function onlyPluginsMiddleware<T extends OnlyPluginsOptions>(
  originalProcessArgs: T,
): T {
  const { categories = [], onlyPlugins: originalOnlyPlugins } =
    originalProcessArgs;

  if (originalOnlyPlugins && originalOnlyPlugins.length > 0) {
    const { verbose, plugins, onlyPlugins } = originalProcessArgs;

    validateOnlyPluginsOption(
      { plugins, categories },
      { onlyPlugins, verbose },
    );

    const onlyPluginsSet = new Set(onlyPlugins);

    return {
      ...originalProcessArgs,
      plugins: plugins.filter(({ slug }) => onlyPluginsSet.has(slug)),
      categories: filterItemRefsBy(categories, ({ plugin }) =>
        onlyPluginsSet.has(plugin),
      ),
    };
  }

  return {
    ...originalProcessArgs,
    // if undefined fill categories with empty array
    categories,
  };
}
