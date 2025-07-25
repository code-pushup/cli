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

export function unifyBundlerStats(stats: EsBuildCoreStats): UnifiedStats {
  const outputKeys = Object.keys(stats.outputs);
  const result: UnifiedStats = {};

  for (let i = 0; i < outputKeys.length; i++) {
    const outputName = outputKeys[i]!;
    const outputInfo = stats.outputs[outputName];
    if (!outputInfo) continue;

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

        for (let j = 0; j < inputKeys.length; j++) {
          const inputPath = inputKeys[j]!;
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
