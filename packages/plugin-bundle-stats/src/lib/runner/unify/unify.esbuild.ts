// ESBuild Bundle Stats Unification (Limited depth with immediate dependencies)
import type { BundleStatsNode, BundleStatsTree } from './bundle-stats.types.js';

export interface EsBuildImport {
  path: string;
  kind: string;
  original: string;
}

export interface EsBuildInput {
  bytes: number;
  imports: EsBuildImport[];
  format?: string;
}

export interface EsBuildOutput {
  bytes?: number;
  inputs?: Record<string, { bytesInOutput?: number }>;
  entryPoint?: string;
  imports?: any[];
  exports?: any[];
  [key: string]: any;
}

export interface EsBuildCoreStats {
  outputs: Record<string, EsBuildOutput>;
  inputs: Record<string, EsBuildInput>;
  [key: string]: any;
}

export interface UnifyBundlerStatsOptions {
  includeDynamicImports: boolean;
  bundler: string;
}

/**
 * Convert ESBuild metafile format to unified BundleStatsTree format
 *
 * Limited depth: shows direct inputs and their immediate dependencies (depth 1).
 * This balances useful information with memory efficiency by avoiding deep recursion.
 */
export function unifyBundlerStats(
  stats: EsBuildCoreStats,
  options: UnifyBundlerStatsOptions,
): BundleStatsTree {
  const outputChildren: BundleStatsNode[] = [];
  let totalBytes = 0;

  // Process each output chunk
  for (const [outputName, outputInfo] of Object.entries(stats.outputs)) {
    // Build input nodes with limited depth (max 1 level of dependencies)
    const inputNodes: BundleStatsNode[] = [];
    let totalInputCount = 0;
    let totalInputBytes = 0;

    for (const [inputPath, inputRec] of Object.entries(
      outputInfo.inputs || {},
    )) {
      const bytesInOutput = inputRec.bytesInOutput || 0;
      totalInputBytes += bytesInOutput;
      const inputInfo = stats.inputs[inputPath];

      // Get immediate dependencies (depth 1 only)
      const immediateChildren: BundleStatsNode[] = [];
      let childCount = 0;

      if (inputInfo?.imports) {
        for (const imp of inputInfo.imports) {
          // Skip dynamic imports if not included
          if (!options.includeDynamicImports && imp.kind === 'dynamic-import') {
            continue;
          }

          // Only include if this dependency is also in the output
          if (outputInfo.inputs?.[imp.path]) {
            const depBytes = outputInfo.inputs[imp.path]?.bytesInOutput || 0;
            immediateChildren.push({
              name: imp.path,
              values: {
                type: 'input',
                path: imp.path,
                bytes: depBytes,
                childCount: 0,
              },
            });
            childCount++;
          }
        }
      }

      inputNodes.push({
        name: inputPath,
        values: {
          type: 'input',
          path: inputPath,
          bytes: bytesInOutput,
          childCount,
        },
        children: immediateChildren.length ? immediateChildren : undefined,
      });

      totalInputCount += childCount + 1; // +1 for the input itself
    }

    // Process external imports (dependencies not bundled into this chunk)
    const externalImports: BundleStatsNode[] = [];
    if (outputInfo.imports && outputInfo.imports.length > 0) {
      for (const imp of outputInfo.imports) {
        // Check if this external import is actually another chunk in our outputs
        const externalOutput = stats.outputs[imp.path];
        const externalBytes = externalOutput?.bytes || 0;

        externalImports.push({
          name: imp.path,
          values: {
            type: 'import',
            path: imp.path,
            bytes: externalBytes, // Use actual size if it's another chunk, 0 for truly external deps
            childCount: 0,
            importKind: imp.kind === 'dynamic-import' ? 'dynamic' : 'static',
          },
        });
      }
    }

    // Combine bundled inputs and external imports
    const allChildren: BundleStatsNode[] = [];
    if (inputNodes.length > 0) {
      allChildren.push(...inputNodes);
    }
    if (externalImports.length > 0) {
      allChildren.push(...externalImports);
    }

    // Create chunk node - use total input bytes as the chunk size since inputs are part of the chunk
    const chunkBytes = totalInputBytes;
    totalBytes += chunkBytes;

    outputChildren.push({
      name: outputName,
      values: {
        type: 'chunk',
        path: outputName,
        bytes: chunkBytes,
        entryPoint: Boolean(outputInfo.entryPoint),
        childCount: totalInputCount + externalImports.length,
      },
      children: allChildren.length ? allChildren : undefined,
    });
  }

  // Compute overall child count
  const totalChildCount = outputChildren.reduce(
    (sum, node) => sum + (node.values.childCount || 0),
    0,
  );

  // Root grouping node
  const root: BundleStatsNode = {
    name: 'unified-bundle-stats',
    values: {
      type: 'group',
      path: '',
      bytes: totalBytes,
      childCount: totalChildCount,
    },
    children: outputChildren,
  };

  return {
    title: 'Bundle Stats',
    type: 'basic',
    root,
  };
}
