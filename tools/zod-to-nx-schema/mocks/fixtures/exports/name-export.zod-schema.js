import { z } from 'zod';

export const basicExecutorOptions = z.object({
  name: z.string().describe('The name of the item'),
  count: z.number().min(0).describe('The count value'),
  enabled: z.boolean().optional().describe('Whether the feature is enabled'),
  tags: z.array(z.string()).optional().describe('List of tags'),
});
