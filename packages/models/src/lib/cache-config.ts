import { z } from 'zod';

export const cacheConfigObjectSchema = z
  .object({
    read: z
      .boolean()
      .describe('Whether to read from cache if available')
      .default(false),
    write: z
      .boolean()
      .describe('Whether to write results to cache')
      .default(false),
  })
  .describe('Cache configuration object for read and/or write operations');
export type CacheConfigObject = z.infer<typeof cacheConfigObjectSchema>;

export const cacheConfigShorthandSchema = z
  .boolean()
  .describe(
    'Cache configuration shorthand for both, read and write operations',
  );
export type CacheConfigShorthand = z.infer<typeof cacheConfigShorthandSchema>;

export const cacheConfigSchema = z
  .union([cacheConfigShorthandSchema, cacheConfigObjectSchema])
  .describe('Cache configuration for read and write operations')
  .default(false);

export type CacheConfig = z.infer<typeof cacheConfigSchema>;
