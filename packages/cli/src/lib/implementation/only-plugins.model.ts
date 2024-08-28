import type { GlobalOptions } from '@code-pushup/core';
import type { CoreConfig } from '@code-pushup/models';

export type OnlyPluginsCliOptions = {
  onlyPlugins?: string[];
};
export type OnlyPluginsOptions = Partial<GlobalOptions> &
  Pick<CoreConfig, 'categories' | 'plugins'> &
  OnlyPluginsCliOptions;
