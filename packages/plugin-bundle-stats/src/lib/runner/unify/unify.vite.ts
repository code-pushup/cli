import type {
  UnifiedStats,
  UnifiedStatsImport,
  UnifiedStatsOutput,
} from './unified-stats.types.js';

export type ViteAsset = {
  name: string;
  size: number;
};

export type ViteModule = {
  name: string;
  size: number;
  chunks: string[];
};

export type ViteChunk = {
  id: string;
  names: string[];
  files: string[];
  entry: boolean;
  initial: boolean;
};

export type ViteCoreStats = {
  builtAt: number;
  assets: ViteAsset[];
  chunks: ViteChunk[];
  modules: ViteModule[];
};

/**
 * Converts Vite bundle stats to unified format. Processes assets, chunks, and modules for bundle analysis.
 */
export function unifyBundlerStats(stats: ViteCoreStats): UnifiedStats {
  const result: UnifiedStats = {};

  const chunksMap = new Map<string, ViteChunk>();
  for (const chunk of stats.chunks) {
    chunksMap.set(chunk.id, chunk);
  }

  const modulesMap = new Map<string, ViteModule>();
  for (const module of stats.modules || []) {
    modulesMap.set(module.name, module);
  }

  // Filter out non-JS assets (like source maps)
  const jsAssets = stats.assets.filter(asset => asset.name.endsWith('.js'));

  for (const asset of jsAssets) {
    const unifiedOutput: UnifiedStatsOutput = {
      path: asset.name,
      bytes: asset.size,
      imports: [],
      inputs: {},
    };

    // Find the chunk that contains this asset
    const chunk = stats.chunks.find(c => c.files.includes(asset.name));
    if (chunk) {
      // Set entry point if it's an entry chunk
      if (chunk.entry && chunk.names.length > 0) {
        unifiedOutput.entryPoint = chunk.names[0];
      }

      // Find modules that belong to this chunk
      const chunkModules =
        stats.modules?.filter(module => module.chunks.includes(chunk.id)) || [];

      // Add inputs
      for (const module of chunkModules) {
        unifiedOutput.inputs![module.name] = {
          bytes: module.size,
        };
      }
    }

    result[asset.name] = unifiedOutput;
  }

  return result;
}
