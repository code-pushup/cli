import { z } from 'zod';
import { slugSchema, urlSchema } from './implementation/schemas.js';

export const uploadConfigSchema = z.object({
  server: urlSchema.describe('URL of deployed portal API'),
  apiKey: z.string({
    description:
      'API key with write access to portal (use `process.env` for security)',
  }),
  organization: slugSchema.describe(
    'Organization slug from Code PushUp portal',
  ),
  project: slugSchema.describe('Project slug from Code PushUp portal'),
  timeout: z
    .number({ description: 'Request timeout in minutes (default is 5)' })
    .positive()
    .int()
    .optional(),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;
