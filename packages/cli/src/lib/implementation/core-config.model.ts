import type {
  CacheConfig,
  CoreConfig,
  Format,
  UploadConfig,
} from '@code-pushup/models';

export type PersistConfigCliOptions = {
  'persist.outputDir'?: string;
  'persist.filename'?: string;
  'persist.format'?: Format;
  'persist.skipReports'?: boolean;
};

export type UploadConfigCliOptions = {
  'upload.organization'?: string;
  'upload.project'?: string;
  'upload.apiKey'?: string;
  'upload.server'?: string;
};

export type CacheConfigCliOptions = {
  'cache.read'?: boolean;
  'cache.write'?: boolean;
  cache?: boolean;
};

export type CoreConfigCliOptions = Pick<CoreConfig, 'persist'> & {
  upload?: Partial<Omit<UploadConfig, 'timeout'>>;
  cache?: CacheConfig;
};
