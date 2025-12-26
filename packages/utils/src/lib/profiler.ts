import { getProfiler } from '@code-pushup/profiler';

export { Profiler } from '@code-pushup/profiler';
export const profiler = getProfiler({
  enabled: process.env['CP_PROFILING'] !== 'false',
  // Auto-detection is enabled by default. Glob patterns match file paths automatically.
  // Set autoDetectContext: false to disable automatic context detection.
  autoDetectContext: true,
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
    plugins: {
      pathPattern: ['**/packages/plugin-*/**/*.ts', '**/code-pushup.preset.ts'],
      group: 'Plugins',
      track: (slug: string) => `Plugin:${slug}`,
      color: 'secondary-dark',
    },
  } as const,
});
