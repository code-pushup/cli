import { z } from 'zod';

export const cacheConfigSchema = z
  .object({
    read: z
      .boolean()
      .describe('Whether to read from cache if available')
      .optional(),
    write: z.boolean().describe('Whether to write results to cache').optional(),
  })
  .describe('Cache configuration for read and write operations');

export type CacheConfig = z.infer<typeof cacheConfigSchema>;
