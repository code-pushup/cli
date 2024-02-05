export type PluginOptions = {
  url: string;
  outputPath?: string;
  onlyAudits?: string | string[];
  verbose?: boolean;
  headless?: boolean;
  userDataDir?: string;
};

export type LighthouseCliOptions = Omit<
  PluginOptions,
  'headless' | 'onlyAudits'
> & {
  headless?: false | 'new';
  userDataDir?: string;
  onlyAudits?: string[];
  onlyCategories?: string[];
};
