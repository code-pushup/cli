import { Format } from '@code-pushup/models';

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

export type ConfigCliOptions = { config: string };

export type CoreConfigCliOptions = ConfigCliOptions &
  PersistConfigCliOptions &
  UploadConfigCliOptions;
