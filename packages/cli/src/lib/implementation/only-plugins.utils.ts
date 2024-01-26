import chalk from 'chalk';
import { CategoryConfig, CoreConfig } from '@code-pushup/models';

export function filterPluginsBySlug(
  plugins: CoreConfig['plugins'],
  { onlyPlugins }: { onlyPlugins?: string[] },
): CoreConfig['plugins'] {
  if (!onlyPlugins?.length) {
    return plugins;
  }
  return plugins.filter(plugin => onlyPlugins.includes(plugin.slug));
}

// skip the whole category if it has at least one skipped plugin ref
// see https://github.com/code-pushup/cli/pull/246#discussion_r1392274281
export function filterCategoryByPluginSlug(
  categories: Array<CategoryConfig>,
  {
    onlyPlugins,
    verbose = false,
  }: { onlyPlugins?: string[]; verbose?: boolean },
): CoreConfig['categories'] {
  // early exit for empty categories
  if (!categories?.length) {
    return categories;
  }
  if (!onlyPlugins?.length) {
    return categories;
  }

  return categories.filter(category =>
    category.refs.every(ref => {
      const isNotSkipped = onlyPlugins.includes(ref.slug);

      if (!isNotSkipped && verbose) {
        console.info(
          `${chalk.yellow('⚠')} Category "${
            category.title
          }" is ignored because it references audits from skipped plugin "${
            ref.slug
          }"`,
        );
      }

      return isNotSkipped;
    }),
  );
}

export function validateOnlyPluginsOption(
  plugins: CoreConfig['plugins'],
  {
    onlyPlugins,
    verbose = false,
  }: { onlyPlugins?: string[]; verbose?: boolean },
): void {
  const missingPlugins = onlyPlugins?.length
    ? onlyPlugins.filter(plugin => !plugins.some(({ slug }) => slug === plugin))
    : [];

  if (missingPlugins.length > 0 && verbose) {
    console.warn(
      `${chalk.yellow(
        '⚠',
      )} The --onlyPlugin argument references plugins with "${missingPlugins.join(
        '", "',
      )}" slugs, but no such plugins are present in the configuration. Expected one of the following plugin slugs: "${plugins
        .map(({ slug }) => slug)
        .join('", "')}".`,
    );
  }
}
