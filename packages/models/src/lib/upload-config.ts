import { z } from 'zod';
import { slugSchema, urlSchema } from './implementation/schemas';

type UploadKeys = 'server' | 'apiKey' | 'organization' | 'project' | 'timeout';
export type UploadSchemaOptions = Partial<Record<UploadKeys, boolean>>;
export type UploadSchemaConfig = {
  optional?: UploadSchemaOptions;
};

export const uploadConfigSchema = (cfg?: UploadSchemaConfig) => {
  const { optional } = cfg ?? {};
  const {
    server: serverOptional,
    apiKey: apiKeyOptional,
    organization: organizationOptional,
    project: projectOptional,
    timeout: timeoutOptional = true,
  } = optional ?? {};
  const serverSchema = urlSchema.describe('URL of deployed portal API');
  const apiKeySchema = z.string({
    description:
      'API key with write access to portal (use `process.env` for security)',
  });
  const organizationSchema = slugSchema.describe(
    'Organization slug from Code PushUp portal',
  );
  const projectSchema = slugSchema.describe(
    'Project slug from Code PushUp portal',
  );
  const timeoutSchema = z
    .number({ description: 'Request timeout in minutes (default is 5)' })
    .positive()
    .int();

  return z.object({
    server: serverOptional ? serverSchema.optional() : serverSchema,
    apiKey: apiKeyOptional ? apiKeySchema.optional() : apiKeySchema,
    organization: organizationOptional
      ? organizationSchema.optional()
      : organizationSchema,
    project: projectOptional ? projectSchema.optional() : projectSchema,
    timeout: timeoutOptional ? timeoutSchema.optional() : timeoutSchema,
  });
};

export type UploadConfig = Required<
  z.infer<ReturnType<typeof uploadConfigSchema>>
>;
