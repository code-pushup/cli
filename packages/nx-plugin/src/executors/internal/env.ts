import type { UploadConfig } from '@code-pushup/models';

export function parseEnv(env: Partial<Record<string, string>>) {
  return {
    ...(env['CP_API_KEY'] && {
      apiKey: env['CP_API_KEY'],
    }),
  } satisfies Partial<UploadConfig>;
}
