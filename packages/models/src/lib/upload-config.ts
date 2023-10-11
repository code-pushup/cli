import { z } from 'zod';
import { urlSchema } from './implementation/schemas';

export const uploadConfigSchema = z.object({
  server: urlSchema('URL of deployed portal API'),
  apiKey: z.string({
    description:
      'API key with write access to portal (use `process.env` for security)',
  }),
  organization: z.string({
    description: 'Organization in code versioning system',
  }),
  project: z.string({
    description: 'Project in code versioning system',
  }),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;
