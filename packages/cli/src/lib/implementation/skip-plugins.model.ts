import { GlobalOptions } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';

export type SkipPluginsCliOptions = {
  skipPlugins?: string[];
};
export type SkipPluginsOptions = Partial<GlobalOptions> &
  Pick<CoreConfig, 'categories' | 'plugins'> &
  SkipPluginsCliOptions;
