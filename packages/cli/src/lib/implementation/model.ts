import { GlobalOptions } from '@code-pushup/core';

export type GeneralCliOptions = { config: string } & GlobalOptions;

export type OnlyPluginsOptions = {
  onlyPlugins: string[];
};
