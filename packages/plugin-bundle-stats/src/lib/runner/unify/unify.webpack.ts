import type {
  UnifiedStats,
  UnifiedStatsImport,
  UnifiedStatsOutput,
} from './unified-stats.types.js';

export type WebpackImportKind = 'import-statement' | 'dynamic-import';

export type WebpackReason = {
  moduleIdentifier: string | null;
  module: string | null;
  moduleName: string | null;
  type: string;
  userRequest: string;
  loc: string;
};

export type WebpackAsset = {
  name: string;
  size: number;
  chunks: string[];
  chunkNames: string[];
  emitted: boolean;
  type: string;
};

export type WebpackModule = {
  identifier: string;
  name: string;
  size: number;
  chunks: string[];
  depth: number | null;
  reasons: WebpackReason[];
  type: string;
  moduleType: string;
  issuer: string | null;
  issuerName: string | null;
  providedExports?: string[];
};

export type WebpackChunk = {
  id: string;
  names: string[];
  files: string[];
  size: number;
  modules: WebpackModule[];
  parents: string[];
  children: string[];
  entry: boolean;
  initial: boolean;
  runtime?: string[];
};

export type WebpackEntrypoint = {
  name: string;
  chunks: string[];
  assets: Array<{ name: string; size: number }>;
};

export type WebpackCoreStats = {
  assets: WebpackAsset[];
  chunks: WebpackChunk[];
  modules: WebpackModule[];
  entrypoints: Record<string, WebpackEntrypoint>;
};

export function unifyBundlerStats(stats: WebpackCoreStats): UnifiedStats {
  const result: UnifiedStats = {};

  const chunksMap = new Map<string, WebpackChunk>();
  for (const chunk of stats.chunks) {
    chunksMap.set(chunk.id, chunk);
  }

  const modulesMap = new Map<string, WebpackModule>();
  for (const module of stats.modules) {
    modulesMap.set(module.identifier, module);
  }

  for (const asset of stats.assets) {
    const unifiedOutput: UnifiedStatsOutput = {
      path: asset.name,
      bytes: asset.size,
      imports: [],
      inputs: {},
    };

    for (const [entryName, entrypoint] of Object.entries(stats.entrypoints)) {
      if (
        entrypoint.assets.some(entryAsset => entryAsset.name === asset.name)
      ) {
        const entryChunks = entrypoint.chunks;
        for (const chunkId of entryChunks) {
          const chunk = chunksMap.get(chunkId);
          if (chunk?.entry) {
            const entryModule = chunk.modules.find(module =>
              module.reasons.some(reason => reason.type === 'entry'),
            );
            if (entryModule) {
              unifiedOutput.entryPoint = entryModule.name;
              break;
            }
          }
        }
        break;
      }
    }

    for (const chunkId of asset.chunks) {
      const chunk = chunksMap.get(chunkId);
      if (!chunk) continue;

      for (const module of chunk.modules) {
        if (module.type === 'runtime') continue;

        if (unifiedOutput.inputs) {
          unifiedOutput.inputs[module.name] = {
            bytes: module.size,
          };
        }

        for (const reason of module.reasons) {
          if (reason.type === 'import()') {
            if (unifiedOutput.imports) {
              unifiedOutput.imports.push({
                path: reason.userRequest,
                kind: 'dynamic-import',
                original: reason.userRequest,
              });
            }
          } else if (
            reason.type === 'harmony side effect evaluation' ||
            reason.type === 'harmony import specifier'
          ) {
            if (unifiedOutput.imports) {
              unifiedOutput.imports.push({
                path: reason.userRequest,
                kind: 'import-statement',
                original: reason.userRequest,
              });
            }
          }
        }
      }
    }

    if (unifiedOutput.imports) {
      const uniqueImports = unifiedOutput.imports.filter(
        (importItem, index, self) =>
          index ===
          self.findIndex(
            item =>
              item.path === importItem.path && item.kind === importItem.kind,
          ),
      );
      unifiedOutput.imports = uniqueImports;
    }

    result[asset.name] = unifiedOutput;
  }

  return result;
}
