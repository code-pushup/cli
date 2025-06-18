import { bundleStatsPlugin } from './bundle-stats-plugin.js';
import type { BundleStatsConfig } from './utils.js';

// Example usage of the bundle stats plugin with filtering
export async function createBundleStatsPluginExample() {
  const configs: BundleStatsConfig[] = [
    {
      name: 'Main App Core',
      include: ['src/main.ts', 'src/app/**'],
    },
    {
      name: 'Auth Module',
      include: ['src/app/auth/**'],
    },
    {
      name: 'Lazy Products',
      include: ['src/app/products/**', '!src/app/products/shared/**'],
    },
  ];

  const plugin = await bundleStatsPlugin({
    artefact: 'bundle-stats.json',
    bundler: 'webpack',
    configs,
  });

  return plugin;
}

// Example configuration for different scenarios
export const exampleConfigs = {
  // Basic module separation
  moduleBasedConfig: [
    {
      name: 'Core Application',
      include: ['src/app/core/**', 'src/main.ts'],
    },
    {
      name: 'Feature Modules',
      include: ['src/app/features/**'],
    },
    {
      name: 'Shared Components',
      include: ['src/app/shared/**'],
    },
  ] as BundleStatsConfig[],

  // Size-focused analysis
  entryPointConfig: [
    {
      name: 'Main Entry Point',
      include: ['src/main.ts'],
    },
    {
      name: 'All Application Code',
      include: ['src/app/**'],
    },
    {
      name: 'Third Party Dependencies',
      include: ['node_modules/**'],
    },
  ] as BundleStatsConfig[],

  // Specific patterns with exclusions
  complexPatternConfig: [
    {
      name: 'Components Without Tests',
      include: ['src/app/**/*.component.ts', '!**/*.spec.ts', '!**/*.test.ts'],
    },
    {
      name: 'Services and Providers',
      include: ['src/app/**/*.service.ts', 'src/app/**/*.provider.ts'],
    },
    {
      name: 'Lazy Loaded Modules',
      include: ['src/app/lazy/**', 'src/app/**/lazy-*.ts'],
    },
  ] as BundleStatsConfig[],
};
