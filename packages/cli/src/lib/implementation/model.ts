import { Format, GlobalOptions } from '@code-pushup/models';

export type GeneralCliOptions = GlobalOptions;

export type CoreConfigCliOptions = {
  'persist.outputDir': string;
  'persist.format': Format | string;
  'upload.organization': string;
  'upload.project': string;
  'upload.apiKey': string;
  'upload.server': string;
};
export type CommandBase = CoreConfigCliOptions & GlobalOptions;
export type ArgsCliObj = Partial<GeneralCliOptions> & {
  format?: Format | Format[];
};
