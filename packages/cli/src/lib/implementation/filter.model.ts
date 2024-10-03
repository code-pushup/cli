import type { GlobalOptions } from '@code-pushup/core';
import type {
  CategoryConfig,
  CoreConfig,
  PluginConfig,
} from '@code-pushup/models';

export type FilterCliOptions = {
  skipCategories?: string[];
  onlyCategories?: string[];
  skipPlugins?: string[];
  onlyPlugins?: string[];
};
export type FilterOptions = Partial<GlobalOptions> &
  Pick<CoreConfig, 'categories' | 'plugins'> &
  FilterCliOptions;

export type FilterOptionType =
  | 'skipCategories'
  | 'onlyCategories'
  | 'skipPlugins'
  | 'onlyPlugins';

export type Filterables = {
  categories: CategoryConfig[];
  plugins: PluginConfig[];
};
