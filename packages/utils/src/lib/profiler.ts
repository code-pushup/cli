import { getProfiler } from '@code-pushup/profiler';
import { serializeCommandWithArgs } from './formatting.js';

export { Profiler } from '@code-pushup/profiler';

function getProcessArgsAsString(): string {
  const args = process.argv.slice(2);
  return args.map(arg => arg.replace(/^--/, '').replace(/=/, ' ')).join(' ');
}
/**
 * The package name to use for the profiler defaultTrack.
 * - 'cli:config-middleware'
 * - 'utils:import-module'
 * - 'models:core-config-parse'
 * - 'core:load-rc-config'
 */
export type PackageName =
  | 'cli' // primary-dark
  | 'utils' // primary-light
  | 'models' // primary-light
  | 'core'; // primary

const pluginColors = {
  color: 'secondary-dark' as const,
};
export const profiler = getProfiler({
  fileBaseName: `code-pushup-cli`,
  namePrefix: 'cp',
  enabled: true,
  captureBuffered: true,
  tracks: {
    defaultTrack: {
      track: 'Core',
      trackGroup: `<✓> Code PushUp - ${serializeCommandWithArgs({
        command: process.argv[2] || 'unknown',
        args: process.argv.slice(3),
      })}`,
      color: 'primary-dark',
    },
    pluginEslint: {
      track: 'Plugins Eslint',
      ...pluginColors,
    },
    pluginCoverage: {
      track: 'Plugins Coverage',
      ...pluginColors,
    },
    pluginAxe: {
      track: 'Plugins Axe',
      ...pluginColors,
    },
    pluginJsPackages: {
      track: 'Plugins JS Packages',
      ...pluginColors,
    },
    pluginJsDocs: {
      track: 'Plugins JS Docs',
      ...pluginColors,
    },
    pluginLighthouse: {
      track: 'Plugins Lighthouse',
      ...pluginColors,
    },
    pluginTypescript: {
      track: 'Plugins TypeScript',
      ...pluginColors,
    },
  },
  errorHandler: error => ({
    properties: [['Stack Track', (error as Error)?.stack || 'Unknown']],
  }),
});
