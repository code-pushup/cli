import { UPLOAD_SERVER, UploadConfig } from '@code-pushup/models';

export const normalizeUploadConfig = (
  cfg?: Partial<UploadConfig>,
): Required<UploadConfig> =>
  ({
    server: UPLOAD_SERVER,
    ...cfg,
  } as unknown as Required<UploadConfig>);
