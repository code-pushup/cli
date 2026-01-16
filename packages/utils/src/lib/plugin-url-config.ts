import { z } from 'zod';
import {
  type PluginUrls,
  nonnegativeNumberSchema,
  weightSchema,
} from '@code-pushup/models';

export const pluginUrlContextSchema = z
  .object({
    urlCount: nonnegativeNumberSchema,
    weights: z.record(z.string(), weightSchema),
  })
  .refine(({ urlCount, weights }) => Object.keys(weights).length === urlCount, {
    message: 'weights count must match urlCount',
  })
  .meta({ title: 'PluginUrlContext' });

export type PluginUrlContext = z.infer<typeof pluginUrlContextSchema>;

export const SINGLE_URL_THRESHOLD = 1;

export function normalizeUrlInput(input: PluginUrls): {
  urls: string[];
  context: PluginUrlContext;
} {
  if (typeof input === 'string') {
    return {
      urls: [input],
      context: {
        urlCount: 1,
        weights: { 1: 1 },
      },
    };
  }
  if (Array.isArray(input)) {
    return {
      urls: input,
      context: {
        urlCount: input.length,
        weights: Object.fromEntries(input.map((_, i) => [i + 1, 1])),
      },
    };
  }
  const entries = Object.entries(input);
  return {
    urls: entries.map(([url]) => url),
    context: {
      urlCount: entries.length,
      weights: Object.fromEntries(
        entries.map(([, weight], i) => [i + 1, weight]),
      ),
    },
  };
}

export function getUrlIdentifier(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    const path = pathname === '/' ? '' : pathname;
    return `${host}${path}`;
  } catch {
    return url;
  }
}
