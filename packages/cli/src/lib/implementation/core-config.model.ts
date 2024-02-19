import type { CoreConfig, Format, UploadConfig } from '@code-pushup/models';

/* eslint-disable @typescript-eslint/naming-convention */
export type PersistConfigCliOptions = {
  'persist.outputDir'?: string;
  'persist.filename'?: string;
  'persist.format'?: Format;
};

export type UploadConfigCliOptions = {
  'upload.organization'?: string;
  'upload.project'?: string;
  'upload.apiKey'?: string;
  'upload.server'?: string;
};
/* eslint-enable @typescript-eslint/naming-convention */

export type ConfigCliOptions = {
  config: string;
  tsconfig?: string;
};

export type CoreConfigCliOptions = Omit<CoreConfig, 'upload'> & {
  upload?: Partial<Omit<UploadConfig, 'timeout'>>;
};
