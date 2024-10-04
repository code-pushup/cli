import type { GlobalOptions } from '@code-pushup/core';
import type {
  CategoryConfig,
  CoreConfig,
  PluginConfig,
} from '@code-pushup/models';

export type FilterOptions = Partial<GlobalOptions> &
  Pick<CoreConfig, 'categories' | 'plugins'> &
  FilterCliOptions;

export type FilterCliOptions = Partial<Record<FilterOptionType, string[]>>;

export type FilterOptionType =
  | 'skipCategories'
  | 'onlyCategories'
  | 'skipPlugins'
  | 'onlyPlugins';

export type Filterables = {
  categories: CategoryConfig[];
  plugins: PluginConfig[];
};
