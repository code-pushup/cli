import { z } from 'zod';
import { slugSchema, urlSchema } from './implementation/schemas';

export const uploadConfigSchema = z.object({
  server: urlSchema('URL of deployed portal API'),
  apiKey: z.string({
    description:
      'API key with write access to portal (use `process.env` for security)',
  }),
  organization: slugSchema('Organization slug from Code PushUp portal'),
  project: slugSchema('Project slug from Code PushUp portal'),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;
