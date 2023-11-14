import { Format, GlobalOptions } from '@code-pushup/models';

// type GeneralCliOnlyOptions = { progress: boolean }; // @TODO consider progress as CLI only options
export type GeneralCliOptions = GlobalOptions;

export type CoreConfigCliOptions = {
  'persist.outputDir': string;
  'persist.filename': string;
  'persist.format': Format;
  'upload.organization': string;
  'upload.project': string;
  'upload.apiKey': string;
  'upload.server': string;
};
export type CommandBase = CoreConfigCliOptions & GlobalOptions;
export type ArgsCliObj = Partial<GeneralCliOptions> & {
  format?: Format | Format[];
};
