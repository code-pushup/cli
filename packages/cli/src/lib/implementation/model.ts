import { GlobalOptions } from '@code-pushup/core';
import { Format } from '@code-pushup/models';

export type GeneralCliOptions = { config: string } & GlobalOptions;

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

export type CoreConfigCliOptions = PersistConfigCliOptions &
  UploadConfigCliOptions;
