import type {
  UnifiedStats,
  UnifiedStatsImport,
  UnifiedStatsOutput,
} from './unified-stats.types.js';

export type RsbuildImportKind = 'import-statement' | 'dynamic-import';

export type RsbuildReason = {
  moduleIdentifier: string | null;
  module: string | null;
  moduleName: string | null;
  type: string;
  userRequest: string;
  loc: string;
  active: boolean;
  moduleId: string | null;
  resolvedModuleId: string | null;
};

export type RsbuildAsset = {
  type: string;
  name: string;
  size: number;
  emitted: boolean;
  cached: boolean;
  chunkNames: string[];
  chunkIdHints: string[];
  chunks: string[];
  auxiliaryChunks: string[];
};

export type RsbuildModule = {
  type: string;
  moduleType: string;
  size: number;
  sizes: Record<string, number>;
  built: boolean;
  codeGenerated: boolean;
  buildTimeExecuted: boolean;
  cached: boolean;
  identifier: string;
  name: string;
  nameForCondition?: string;
  index: number;
  preOrderIndex: number;
  index2: number;
  postOrderIndex: number;
  cacheable: boolean;
  optional: boolean;
  orphan: boolean;
  dependent?: boolean;
  issuer?: string | null;
  issuerName?: string | null;
  issuerPath?: Array<{
    identifier: string;
    name: string;
    id: string;
  }>;
  failed: boolean;
  errors: number;
  warnings: number;
  id: string;
  issuerId?: string;
  chunks: string[];
  assets: string[];
  reasons: RsbuildReason[];
  usedExports: string[] | null;
  providedExports?: string[];
  optimizationBailout: string[];
  depth: number;
};

export type RsbuildChunk = {
  type: string;
  rendered: boolean;
  initial: boolean;
  entry: boolean;
  reason?: string;
  size: number;
  sizes: Record<string, number>;
  names: string[];
  idHints: string[];
  runtime: string[];
  files: string[];
  auxiliaryFiles: string[];
  hash: string;
  childrenByOrder: Record<string, unknown>;
  id: string;
  siblings: string[];
  parents: string[];
  children: string[];
  modules: RsbuildModule[];
  origins: Array<{
    module: string;
    moduleIdentifier: string;
    moduleName: string;
    loc: string;
    request: string;
    moduleId: string;
  }>;
};

export type RsbuildEntrypoint = {
  name: string;
  chunks: string[];
  assets: Array<{ name: string; size: number }>;
  filteredAssets: number;
  assetsSize: number;
  auxiliaryAssets: Array<{ name: string; size: number }>;
  auxiliaryAssetsSize: number;
  children: Record<string, unknown>;
  childAssets: Record<string, unknown>;
  isOverSizeLimit: boolean;
};

export type RsbuildCoreStats = {
  name: string;
  hash: string;
  version: string;
  rspackVersion: string;
  time: number;
  builtAt: number;
  publicPath: string;
  outputPath: string;
  assetsByChunkName: Record<string, string[]>;
  assets: RsbuildAsset[];
  chunks: RsbuildChunk[];
  modules: RsbuildModule[];
  entrypoints: Record<string, RsbuildEntrypoint>;
  namedChunkGroups: Record<string, RsbuildEntrypoint>;
  errors: unknown[];
  errorsCount: number;
  warnings: unknown[];
  warningsCount: number;
  children: unknown[];
};

export function unifyBundlerStats(stats: RsbuildCoreStats): UnifiedStats {
  const result: UnifiedStats = {};

  const chunksMap = new Map<string, RsbuildChunk>();
  for (const chunk of stats.chunks) {
    chunksMap.set(chunk.id, chunk);
  }

  const modulesMap = new Map<string, RsbuildModule>();
  for (const module of stats.modules) {
    modulesMap.set(module.identifier, module);
  }

  for (const asset of stats.assets) {
    if (!asset.name.endsWith('.js')) continue;

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
        if (module.moduleType === 'runtime') continue;

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
            reason.type === 'esm import' ||
            reason.type === 'esm import specifier'
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
