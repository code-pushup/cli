import { z } from 'zod';
import { slugSchema, urlSchema } from './implementation/schemas.js';

export const uploadConfigSchema = z
  .object({
    server: urlSchema.meta({ description: 'URL of deployed portal API' }),
    apiKey: z.string().meta({
      description:
        'API key with write access to portal (use `process.env` for security)',
    }),
    organization: slugSchema.meta({
      description: 'Organization slug from Code PushUp portal',
    }),
    project: slugSchema.meta({
      description: 'Project slug from Code PushUp portal',
    }),
    timeout: z
      .number()
      .positive()
      .int()
      .optional()
      .meta({ description: 'Request timeout in minutes (default is 5)' }),
  })
  .meta({ title: 'UploadConfig' });

export type UploadConfig = z.infer<typeof uploadConfigSchema>;
