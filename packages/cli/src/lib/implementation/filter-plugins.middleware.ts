import { filterItemRefsBy } from '@code-pushup/utils';
import type { OnlyPluginsOptions } from './only-plugins.model';
import type { SkipPluginsOptions } from './skip-plugins.model';
import {
  handleConflictingPlugins,
  validatePluginFilterOption,
} from './validate-plugin-filter-options.utils';

export function filterPluginsMiddleware<
  T extends SkipPluginsOptions & OnlyPluginsOptions,
>(originalProcessArgs: T): T {
  const {
    plugins,
    categories = [],
    skipPlugins = [],
    onlyPlugins = [],
    verbose,
  } = originalProcessArgs;

  if (skipPlugins.length === 0 && onlyPlugins.length === 0) {
    return { ...originalProcessArgs, categories };
  }

  handleConflictingPlugins(onlyPlugins, skipPlugins);

  validatePluginFilterOption(
    'skipPlugins',
    { plugins, categories },
    { pluginsToFilter: skipPlugins, verbose },
  );
  validatePluginFilterOption(
    'onlyPlugins',
    { plugins, categories },
    { pluginsToFilter: onlyPlugins, verbose },
  );

  const validSkipPlugins = new Set(
    skipPlugins.filter(sP => plugins.some(p => p.slug === sP)),
  );
  const pluginsAfterSkip = plugins.filter(
    ({ slug }) => !validSkipPlugins.has(slug),
  );

  const validOnlyPlugins = new Set(
    onlyPlugins.filter(oP => pluginsAfterSkip.some(p => p.slug === oP)),
  );
  const filteredPlugins =
    validOnlyPlugins.size > 0
      ? pluginsAfterSkip.filter(({ slug }) => validOnlyPlugins.has(slug))
      : pluginsAfterSkip;

  const filteredCategories =
    filteredPlugins.length > 0
      ? filterItemRefsBy(categories, ({ plugin }) =>
          filteredPlugins.some(({ slug }) => slug === plugin),
        )
      : categories;

  return {
    ...originalProcessArgs,
    plugins: filteredPlugins,
    categories: filteredCategories,
  };
}
