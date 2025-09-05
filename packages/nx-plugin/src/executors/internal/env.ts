import { z } from 'zod';
import type { UploadConfig } from '@code-pushup/models';

// load upload configuration from environment
const envSchema = z
  .object({
    CP_SERVER: z.string().url().optional(),
    CP_API_KEY: z.string().optional(),
    CP_ORGANIZATION: z.string().min(1).optional(),
    CP_PROJECT: z.string().min(1).optional(),
    CP_TIMEOUT: z.string().regex(/^\d+$/).optional(),
  })
  .partial();

type UploadEnvVars = z.infer<typeof envSchema>;

const envToConfigMap = {
  CP_SERVER: 'server',
  CP_API_KEY: 'apiKey',
  CP_ORGANIZATION: 'organization',
  CP_PROJECT: 'project',
  CP_TIMEOUT: 'timeout',
} as const;

export function parseEnv(env: unknown = {}): Partial<UploadConfig> {
  const upload: UploadEnvVars = envSchema.parse(env);

  return Object.fromEntries(
    Object.entries(upload)
      .filter(([_, value]) => value != null && value !== '')
      .map(([envKey, value]) => {
        const configKey = envToConfigMap[envKey as keyof typeof envToConfigMap];
        if (configKey === 'timeout') {
          const timeout = Number(value);
          if (timeout >= 0) {
            return [configKey, timeout] as const;
          }
          return null;
        }
        return [configKey, value] as const;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  );
}
