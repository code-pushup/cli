// ESBuild Bundle Stats Unification
import type { BundleStatsNode, BundleStatsTree } from './bundle-stats.types.js';

export interface EsBuildCoreStats {
  // ESBuild metafile structure
  outputs: Record<
    string,
    {
      bytes?: number;
      inputs?: Record<
        string,
        {
          bytesInOutput?: number;
        }
      >;
      entryPoint?: string;
      [key: string]: any;
    }
  >;
  inputs: Record<string, any>;
  [key: string]: any;
}

export interface UnifyBundlerStatsOptions {
  includeDynamicImports: boolean;
  bundler: string;
}

// Convert ESBuild metafile format to unified BundleStatsTree format
export function unifyBundlerStats(
  stats: EsBuildCoreStats,
  options: UnifyBundlerStatsOptions,
): BundleStatsTree {
  const allChildren: BundleStatsNode[] = [];
  let totalBytes = 0;
  let totalFiles = 0;

  // Process each output file directly as children of the root
  for (const [outputFilename, outputInfo] of Object.entries(stats.outputs)) {
    const outputBytes = outputInfo.bytes || 0;
    totalBytes += outputBytes;
    totalFiles++;

    // Create children nodes from the inputs of this output
    const inputChildren: BundleStatsNode[] = [];

    if (outputInfo.inputs) {
      for (const [inputPath, inputInfo] of Object.entries(outputInfo.inputs)) {
        const inputBytes = inputInfo.bytesInOutput || 0;

        inputChildren.push({
          name: inputPath,
          values: {
            type: 'input',
            path: inputPath,
            bytes: inputBytes,
          },
        });
      }
    }

    // Create the output node as a direct child of root
    const outputNode: BundleStatsNode = {
      name: outputFilename,
      values: {
        type: 'chunk',
        path: outputFilename,
        bytes: outputBytes,
        isEntryFile: !!outputInfo.entryPoint,
        childCount: inputChildren.length,
      },
      children: inputChildren.length > 0 ? inputChildren : undefined,
    };

    allChildren.push(outputNode);
  }

  // Create a placeholder static imports node (this will be enhanced later)
  const mainEntry = allChildren.find(node => node.name.includes('main'));
  if (mainEntry) {
    const staticImportsNode: BundleStatsNode = {
      name: `static imports from ${mainEntry.name}`,
      values: {
        type: 'group',
        path: 'static-imports',
        bytes: 0,
        childCount: 0,
      },
      children: [
        {
          name: 'chunk-placeholder.js',
          values: {
            type: 'chunk',
            path: 'chunk-placeholder.js',
            bytes: 0,
            childCount: 0,
          },
        },
      ],
    };

    allChildren.push(staticImportsNode);
  }

  // Create root node with all children directly attached
  const root: BundleStatsNode = {
    name: 'audit-slug', // This will be replaced with actual audit slug
    values: {
      type: 'group',
      path: '',
      bytes: totalBytes,
      childCount: totalFiles,
    },
    children: allChildren,
  };

  return {
    title: 'Bundle Stats',
    type: 'basic',
    root,
  };
}
