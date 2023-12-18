import { z } from 'zod';
import { UploadConfig } from '@code-pushup/models';

export const envSchema = z.object({
  CP_SERVER: z.string().url(),
  CP_API_KEY: z.string().min(1),
  CP_ORGANIZATION: z.string().min(1),
  CP_PROJECT: z.string().min(1),
});
export type Env = z.infer<typeof envSchema>;

export function uploadConfigFromEnv(): UploadConfig {
  const env = envSchema.parse(envToUploadConfig(process.env as Env));
  return {
    server: env.CP_SERVER,
    apiKey: env.CP_API_KEY,
    organization: env.CP_ORGANIZATION,
    project: env.CP_PROJECT,
  };
}

export function envToUploadConfig(env?: Env): UploadConfig {
  return {
    server: env?.CP_SERVER || '',
    apiKey: env?.CP_API_KEY || '',
    organization: env?.CP_ORGANIZATION || '',
    project: env?.CP_PROJECT || '',
  };
}
