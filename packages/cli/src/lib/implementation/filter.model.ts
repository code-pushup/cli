import type { GlobalOptions } from '@code-pushup/core';
import type { CoreConfig } from '@code-pushup/models';

export type FilterOptions = Partial<GlobalOptions> &
  Pick<CoreConfig, 'categories' | 'plugins'> &
  FilterCliOptions;

export type FilterCliOptions = Partial<Record<FilterOptionType, string[]>>;

export type FilterOptionType =
  | 'skipCategories'
  | 'onlyCategories'
  | 'skipPlugins'
  | 'onlyPlugins';

export type Filterables = Pick<CoreConfig, 'plugins' | 'categories'>;
