import { GlobalOptions } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';

export type OnlyPluginsCliOptions = {
  onlyPlugins?: string[];
};
export type OnlyPluginsOptions = Partial<GlobalOptions> &
  Pick<CoreConfig, 'categories' | 'plugins'> &
  OnlyPluginsCliOptions;
