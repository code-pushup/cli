import { UploadConfig } from '../../src';

export function uploadConfig(opt?: Partial<UploadConfig>): UploadConfig {
  return {
    apiKey: 'm0ck-API-k3y',
    server: 'http://test.server.io',
    organization: 'code-pushup',
    project: 'cli',
    ...opt,
  };
}
