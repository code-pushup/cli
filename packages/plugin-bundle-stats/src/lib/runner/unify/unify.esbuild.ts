import { minimatch } from 'minimatch';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
  UnifiedStatsImport,
} from './unified-stats.types.js';

export type EsBuildImportKind = 'import-statement' | 'dynamic-import';

export type EsBuildInputImport = {
  path: string;
  kind: EsBuildImportKind;
  original: string;
};

export type EsBuildOutputImport = {
  path: string;
  kind: EsBuildImportKind;
  external?: boolean;
  original?: string;
};

export type EsBuildInput = {
  bytes: number;
  imports: EsBuildInputImport[];
  format?: string;
};

export type EsBuildOutput = {
  bytes: number;
  inputs?: Record<string, { bytesInOutput: number }>;
  entryPoint?: string;
  imports?: EsBuildOutputImport[];
  exports?: string[];
};

export type EsBuildCoreStats = {
  outputs: Record<string, EsBuildOutput>;
  inputs: Record<string, EsBuildInput>;
};

export type EsBuildUnifyOptions = {
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

export function unifyBundlerStats(
  stats: EsBuildCoreStats,
  options: EsBuildUnifyOptions,
): UnifiedStats {
  const { excludeOutputs = ['**/*.map', '**/*.d.ts'] } = options;

  const outputKeys = Object.keys(stats.outputs);
  const result: UnifiedStats = {};

  for (const outputKey of outputKeys) {
    const outputName = outputKey!;
    const outputInfo = stats.outputs[outputName];
    if (!outputInfo) {
      continue;
    }

    // Skip outputs that match exclude patterns
    if (shouldExcludeOutput(outputName, excludeOutputs)) {
      continue;
    }

    const {
      bytes,
      entryPoint,
      imports,
      exports,
      inputs: outputInputs,
      ...additionalProps
    } = outputInfo;

    const unifiedOutput: UnifiedStatsBundle = {
      path: outputName,
      bytes,
    };

    if (entryPoint !== undefined) {
      unifiedOutput.entryPoint = entryPoint;
    }

    unifiedOutput.imports = imports
      ? imports.map(imp => {
          const unifiedImport: UnifiedStatsImport = {
            path: imp.path,
            kind: imp.kind,
          };

          if ('original' in imp && typeof imp.original === 'string') {
            unifiedImport.original = imp.original;
          }

          return unifiedImport;
        })
      : [];

    Object.assign(unifiedOutput, additionalProps);

    if (outputInputs) {
      const inputKeys = Object.keys(outputInputs);
      if (inputKeys.length > 0) {
        const inputs: Record<string, { bytes: number }> = {};

        for (const inputKey of inputKeys) {
          const inputPath = inputKey!;
          const outputInputInfo = outputInputs[inputPath];

          if (outputInputInfo?.bytesInOutput !== undefined) {
            inputs[inputPath] = {
              bytes: outputInputInfo.bytesInOutput,
            };
          }
        }

        unifiedOutput.inputs = inputs;
      } else {
        unifiedOutput.inputs = {};
      }
    } else {
      unifiedOutput.inputs = {};
    }

    result[outputName] = unifiedOutput;
  }

  return result;
}
