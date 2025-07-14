import type {
  UnifiedStats,
  UnifiedStatsImport,
  UnifiedStatsOutput,
} from './unified-stats.types.js';

export type ViteAsset = {
  name: string;
  size: number;
  emitted: boolean;
  type: string;
};

export type ViteModule = {
  identifier: string;
  name: string;
  size: number;
  chunks: string[];
};

export type ViteChunk = {
  id: string;
  names: string[];
  files: string[];
  size: number;
  modules: ViteModule[];
  entry: boolean;
  initial: boolean;
};

export type ViteEntrypoint = {
  name: string;
  chunks: string[];
  assets: Array<{ name: string; size: number }>;
};

export type ViteCoreStats = {
  assets: ViteAsset[];
  chunks: ViteChunk[];
  modules: ViteModule[];
  entrypoints: Record<string, ViteEntrypoint>;
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
    modulesMap.set(module.identifier, module);
  }

  for (const asset of stats.assets) {
    const unifiedOutput: UnifiedStatsOutput = {
      path: asset.name,
      bytes: asset.size,
      imports: [],
      inputs: {},
    };

    for (const [entryName, entrypoint] of Object.entries(
      stats.entrypoints || {},
    )) {
      if (
        entrypoint.assets.some(entryAsset => entryAsset.name === asset.name)
      ) {
        unifiedOutput.entryPoint = entryName;
        break;
      }
    }

    // Find chunks that include this asset
    const relatedChunks = stats.chunks.filter(chunk =>
      chunk.files.includes(asset.name),
    );

    for (const chunk of relatedChunks) {
      for (const module of chunk.modules || []) {
        const moduleInfo = modulesMap.get(module.identifier);
        if (moduleInfo) {
          unifiedOutput.inputs![moduleInfo.name] = {
            bytes: moduleInfo.size || 0,
          };
        }
      }
    }

    result[asset.name] = unifiedOutput;
  }

  return result;
}
