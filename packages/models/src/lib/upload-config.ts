import { z } from 'zod';
import { urlSchema } from './implementation/schemas';

export const uploadConfigSchema = z.object({
  server: urlSchema('URL of deployed portal API'),
  apiKey: z.string({
    description:
      'API key with write access to portal (use `process.env` for security)',
  }),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;
