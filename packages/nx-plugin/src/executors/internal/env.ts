import { z } from 'zod';
import type { UploadConfig } from '@code-pushup/models';

// load upload configuration from environment
const envSchema = z
  .object({
    CP_SERVER: z.string().url().optional(),
    CP_API_KEY: z.string().min(1).optional(),
    CP_ORGANIZATION: z.string().min(1).optional(),
    CP_PROJECT: z.string().min(1).optional(),
    CP_TIMEOUT: z.string().regex(/^\d+$/).optional(),
  })
  .partial();

type UploadEnvVars = z.infer<typeof envSchema>;

export function parseEnv(env: unknown = {}): Partial<UploadConfig> {
  const upload: UploadEnvVars = envSchema.parse(env);

  return Object.fromEntries(
    Object.entries(upload).map(([envKey, value]) => {
      switch (envKey) {
        case 'CP_SERVER':
          return ['server', value];
        case 'CP_API_KEY':
          return ['apiKey', value];
        case 'CP_ORGANIZATION':
          return ['organization', value];
        case 'CP_PROJECT':
          return ['project', value];
        case 'CP_TIMEOUT':
          return Number(value) >= 0 ? ['timeout', Number(value)] : [];
        default:
          return [];
      }
    }),
  );
}
