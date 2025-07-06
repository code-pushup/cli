import type { AuditOutput } from '@code-pushup/models';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import type { BundleStatsTree } from './processing/bundle-stats.types.js';
import {
  type EsBuildCoreStats,
  unifyBundlerStats,
} from './processing/unify.esbuild.js';
import type {
  BundleStatsConfig,
  GroupingOptions,
  PruningOptions,
  SupportedBundlers,
} from './types.js';
import {
  getTreesByConfig,
  filterUnifiedTreeByConfig as getTreesByConfigs,
} from './utils.js';

export type PluginArtefactOptions = {
  generateArtefacts?: {
    command: string;
    args: string[];
  };
  artefactsPath: string;
};

export type BundleStatsRunnerOptions = PluginArtefactOptions & {
  bundler: SupportedBundlers;
  configs: BundleStatsConfig[];
  grouping?: GroupingOptions[];
  pruning?: PruningOptions;
};

/**
 * Creates a bundle stats audit runner that processes bundler output and generates audit results
 *
 * @param opts - Configuration options for the bundle stats runner
 * @param opts.artefact - Path to the bundler stats file (JSON)
 * @param opts.bundler - Type of bundler that generated the stats ('esbuild', 'webpack', or 'rsbuild')
 * @param opts.configs - Array of bundle analysis configurations
 * @returns Promise that resolves to a function that returns audit output when called
 *
 * @example
 * ```typescript
 * const runner = await bundleStatsRunner({
 *   artefact: 'dist/stats.json',
 *   bundler: 'webpack',
 *   configs: [
 *     {
 *       name: 'main-bundle',
 *       include: ['src/**'],
 *       thresholds: { totalSize: 1024 * 1024 } // 1MB
 *     }
 *   ]
 * });
 *
 * const auditResults = await runner();
 * ```
 */
export async function bundleStatsRunner(
  opts: BundleStatsRunnerOptions,
): Promise<() => Promise<AuditOutput[]>> {
  const {
    artefactsPath,
    generateArtefacts,
    bundler,
    configs,
    grouping,
    pruning,
  } = opts;

  return async () => {
    if (generateArtefacts) {
      const { command, args } = generateArtefacts;
      await executeProcess({
        command,
        args,
      });
    }

    const stats = await readJsonFile<EsBuildCoreStats>(artefactsPath);
    const unifieBundleStats = unifyBundlerStats(stats, {
      includeDynamicImports: false,
      bundler,
    });

    const bundleStatsTree = unifieBundleStats as unknown as BundleStatsTree;

    const trees = getTreesByConfigs(bundleStatsTree, configs);

    return getTreesByConfig(trees, configs, { grouping, pruning });
  };
}

// @TODO
// Scoring is based on LH metrics for biggest chunk size
//
