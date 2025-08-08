import type { CoreConfig, Format, UploadConfig } from '@code-pushup/models';

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

export type ConfigCliOptions = {
  config?: string;
  tsconfig?: string;
  verbose?: string;
};

export type CoreConfigCliOptions = Pick<CoreConfig, 'persist' | 'cache'> & {
  upload?: Partial<Omit<UploadConfig, 'timeout'>>;
};
