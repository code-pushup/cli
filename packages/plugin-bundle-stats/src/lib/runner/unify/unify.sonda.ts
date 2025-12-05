import { minimatch } from 'minimatch';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
  UnifiedStatsImport,
} from './unified-stats.types.js';

export type SondaResourceKind = 'asset' | 'filesystem';
export type SondaResourceType = 'script' | 'style' | 'font' | 'image' | 'other';
export type SondaConnectionKind = 'import' | 'entrypoint' | 'dynamic-import';

export type SondaResource = {
  kind: SondaResourceKind;
  name: string;
  type: SondaResourceType;
  uncompressed: number;
  gzip?: number;
  brotli?: number;
  format?: string;
};

export type SondaConnection = {
  kind: SondaConnectionKind;
  source: string;
  target: string;
  original: string | null;
};

export type SondaCoreStats = {
  metadata: {
    version: string;
    integration: string;
    sources: boolean;
    gzip: boolean;
    brotli: boolean;
  };
  resources: SondaResource[];
  connections: SondaConnection[];
  dependencies: unknown[];
  issues: unknown[];
  sourcemaps: unknown[];
};

export type SondaUnifyOptions = {
  excludeOutputs?: string[];
};

/**
 * Checks if path matches any exclude pattern. Filters unwanted files from bundle stats.
 */
function shouldExcludeOutput(
  outputPath: string,
  excludePatterns: string[],
): boolean {
  return excludePatterns.some(pattern => minimatch(outputPath, pattern));
}

/**
 * Converts Sonda connection kind to unified import kind
 */
function mapConnectionKind(
  kind: SondaConnectionKind,
): 'import-statement' | 'dynamic-import' {
  return kind === 'dynamic-import' ? 'dynamic-import' : 'import-statement';
}

export function unifyBundlerStats(
  stats: SondaCoreStats,
  options: SondaUnifyOptions,
): UnifiedStats {
  const { excludeOutputs = ['**/*.map', '**/*.d.ts'] } = options;

  // Filter asset resources (outputs)
  const assets = stats.resources.filter(r => r.kind === 'asset');
  const filesystemResources = stats.resources.filter(
    r => r.kind === 'filesystem',
  );

  // Build a map of entrypoints: output -> source
  const entryPointMap = new Map<string, string>();
  for (const conn of stats.connections) {
    if (conn.kind === 'entrypoint') {
      entryPointMap.set(conn.target, conn.source);
    }
  }

  // Build a map of imports for each output
  const outputImportsMap = new Map<string, UnifiedStatsImport[]>();
  const outputInputsMap = new Map<string, Map<string, number>>();

  // Process connections to build import relationships
  for (const conn of stats.connections) {
    if (conn.kind === 'import' || conn.kind === 'dynamic-import') {
      // Find which output this source belongs to by tracing entrypoints
      const sourceFile = conn.source;

      // For each asset, check if this source is part of its dependency tree
      for (const asset of assets) {
        const entryPoint = entryPointMap.get(asset.name);
        if (
          entryPoint &&
          isPartOfDependencyTree(sourceFile, entryPoint, stats.connections)
        ) {
          const imports = outputImportsMap.get(asset.name) || [];
          imports.push({
            path: conn.target,
            kind: mapConnectionKind(conn.kind),
            ...(conn.original && { original: conn.original }),
          });
          outputImportsMap.set(asset.name, imports);
        }
      }
    }
  }

  // Build inputs map for each output
  for (const asset of assets) {
    const entryPoint = entryPointMap.get(asset.name);
    if (entryPoint) {
      const inputsMap = new Map<string, number>();

      // Add the entry point itself
      const entryResource = filesystemResources.find(
        r => r.name === entryPoint,
      );
      if (entryResource) {
        inputsMap.set(entryPoint, entryResource.uncompressed);
      }

      // Add all dependencies
      const deps = getAllDependencies(entryPoint, stats.connections);
      for (const dep of deps) {
        const depResource = filesystemResources.find(r => r.name === dep);
        if (depResource) {
          inputsMap.set(dep, depResource.uncompressed);
        }
      }

      outputInputsMap.set(asset.name, inputsMap);
    }
  }

  const result: UnifiedStats = {};

  for (const asset of assets) {
    // Skip outputs that match exclude patterns
    if (shouldExcludeOutput(asset.name, excludeOutputs)) {
      continue;
    }

    const unifiedOutput: UnifiedStatsBundle = {
      path: asset.name,
      bytes: asset.uncompressed,
      imports: outputImportsMap.get(asset.name) || [],
      inputs: {},
    };

    const entryPoint = entryPointMap.get(asset.name);
    if (entryPoint) {
      unifiedOutput.entryPoint = entryPoint;
    }

    const inputsMap = outputInputsMap.get(asset.name);
    if (inputsMap) {
      for (const [inputPath, bytes] of inputsMap) {
        unifiedOutput.inputs![inputPath] = { bytes };
      }
    }

    result[asset.name] = unifiedOutput;
  }

  return result;
}

/**
 * Check if a source file is part of the dependency tree of an entry point
 */
function isPartOfDependencyTree(
  source: string,
  entryPoint: string,
  connections: SondaConnection[],
): boolean {
  if (source === entryPoint) return true;

  const visited = new Set<string>();
  const queue = [entryPoint];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === source) return true;

    // Find all imports from current
    for (const conn of connections) {
      if (
        conn.source === current &&
        (conn.kind === 'import' || conn.kind === 'dynamic-import')
      ) {
        queue.push(conn.target);
      }
    }
  }

  return false;
}

/**
 * Get all dependencies of a source file
 */
function getAllDependencies(
  source: string,
  connections: SondaConnection[],
): string[] {
  const deps = new Set<string>();
  const visited = new Set<string>();
  const queue = [source];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const conn of connections) {
      if (
        conn.source === current &&
        (conn.kind === 'import' || conn.kind === 'dynamic-import')
      ) {
        deps.add(conn.target);
        queue.push(conn.target);
      }
    }
  }

  return Array.from(deps);
}
