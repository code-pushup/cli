import {
  type UploadConfig,
  uploadConfigSchema,
  validate,
} from '@code-pushup/models';

export function uploadConfig(opt?: Partial<UploadConfig>): UploadConfig {
  return validate(uploadConfigSchema, {
    apiKey: 'm0ck-API-k3y',
    server: 'http://test.server.io',
    organization: 'code-pushup',
    project: 'cli',
    ...opt,
  });
}
