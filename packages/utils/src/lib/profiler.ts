import { getProfiler } from '@code-pushup/profiler';
import { logger } from './logger.js';

export { Profiler } from '@code-pushup/profiler';
export const profiler = getProfiler({
  enabled: process.env['CP_PROFILING'] !== 'false',
  logger,
  prefixMarks: 'cp:',
  spans: {
    // CLI group - matches all CLI-related files
    cli: {
      pathPattern: [
        '**/packages/cli/**/*.ts',
        '**/packages/core/**/*.ts',
        '**/packages/utils/**/*.ts',
      ],
      group: 'CLI',
      track: 'CLI',
      color: 'primary-dark',
    },
    // Plugins group - matches all plugin files
    // Plugin name is auto-extracted from path (e.g., plugin-eslint -> Plugin:eslint)
    plugin: (slug: string) => ({
      pathPattern: ['**/packages/plugin-*/**/*.ts', '**/code-pushup.preset.ts'],
      group: 'Plugins',
      track: `Plugin:${slug}`,
      color: 'secondary-dark',
    }),
  } as const,
});
