import { z } from 'zod';

export const cacheConfigObjectSchema = z
  .object({
    read: z
      .boolean()
      .meta({ description: 'Whether to read from cache if available' })
      .default(false),
    write: z
      .boolean()
      .meta({ description: 'Whether to write results to cache' })
      .default(false),
  })
  .meta({
    title: 'CacheConfigObject',
    description: 'Cache configuration object for read and/or write operations',
  });
export type CacheConfigObject = z.infer<typeof cacheConfigObjectSchema>;

export const cacheConfigShorthandSchema = z.boolean().meta({
  title: 'CacheConfigShorthand',
  description:
    'Cache configuration shorthand for both, read and write operations',
});
export type CacheConfigShorthand = z.infer<typeof cacheConfigShorthandSchema>;

export const cacheConfigSchema = z
  .union([cacheConfigShorthandSchema, cacheConfigObjectSchema])
  .meta({
    title: 'CacheConfig',
    description: 'Cache configuration for read and write operations',
  })
  .default(false);

export type CacheConfig = z.infer<typeof cacheConfigSchema>;
