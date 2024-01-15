import { GlobalOptions } from '@code-pushup/core';
import { Format } from '@code-pushup/models';

export type GeneralCliOptions = { config: string } & GlobalOptions;

/* eslint-disable @typescript-eslint/naming-convention */
export type PersistConfigCliOptions = {
  'persist.outputDir': string;
  'persist.filename': string;
  'persist.format': Format;
};

export type UploadConfigCliOptions = {
  'upload.organization': string;
  'upload.project': string;
  'upload.apiKey': string;
  'upload.server': string;
};
/* eslint-enable @typescript-eslint/naming-convention */

export type CoreConfigCliOptions = PersistConfigCliOptions &
  UploadConfigCliOptions;

export type OnlyPluginsOptions = {
  onlyPlugins: string[];
};
