import type { BasicTree, BasicTreeNode } from '../../../models/src/lib/tree.js';

/**
 * Standardized import kinds across bundlers
 */
export type ImportKind =
  | 'entry-point'
  // ES6 Module imports
  | 'import-statement' // Generic ES6 import
  | 'import-side-effect' // import './file' (side effects only)
  | 'import-specifier' // import { named } from './file'
  | 'import-default' // import default from './file'
  | 'import-namespace' // import * as ns from './file'
  // Dynamic imports
  | 'dynamic-import' // import('./file')
  // CommonJS
  | 'require-call' // require('./file')
  | 'require-resolve' // require.resolve('./file')
  // CSS imports
  | 'import-rule' // @import in CSS
  | 'url-token' // url() in CSS
  // Asset imports
  | 'asset-import' // Static asset imports
  // Re-exports
  | 'export-import' // export { x } from './file'
  // Bundler-specific
  | 'extract-css' // CSS extraction
  | 'context-element' // Dynamic context imports
  | 'hot-module' // HMR related imports
  | 'delegated'; // Module federation/delegated imports

/**
 * Maps webpack internal import types to standardized ImportKind
 */
function mapWebpackTypeToImportKind(webpackType: string): ImportKind {
  switch (webpackType) {
    case 'entry':
      return 'entry-point';

    // ES6 Module imports - more fine-grained
    case 'harmony side effect evaluation':
      return 'import-side-effect';
    case 'harmony import specifier':
      return 'import-specifier';
    case 'harmony default specifier':
      return 'import-default';
    case 'harmony namespace specifier':
      return 'import-namespace';
    case 'harmony export imported specifier':
      return 'export-import';

    // ESBuild/Rsbuild ES6 imports
    case 'esm import':
      return 'import-statement';
    case 'esm import specifier':
      return 'import-specifier';

    // Dynamic imports
    case 'import()':
    case 'dynamic import':
      return 'dynamic-import';

    // CommonJS
    case 'cjs require':
    case 'commonjs require':
    case 'require call':
      return 'require-call';
    case 'require.resolve':
    case 'require.resolve context':
      return 'require-resolve';

    // CSS
    case 'css @import':
      return 'import-rule';
    case 'css url()':
      return 'url-token';
    case 'extract css':
      return 'extract-css';

    // Bundler-specific
    case 'context element':
      return 'context-element';
    case 'module hot accepted':
    case 'module hot declined':
      return 'hot-module';
    case 'delegated source':
    case 'delegated exports':
      return 'delegated';

    // AMD (for completeness)
    case 'amd require':
      return 'require-call';

    default:
      // Fallback - try to infer from the string
      if (webpackType.includes('import') && webpackType.includes('()')) {
        return 'dynamic-import';
      }
      if (
        webpackType.includes('harmony') &&
        webpackType.includes('side effect')
      ) {
        return 'import-side-effect';
      }
      if (
        webpackType.includes('harmony') &&
        webpackType.includes('specifier')
      ) {
        return 'import-specifier';
      }
      if (webpackType.includes('require')) {
        return 'require-call';
      }
      if (webpackType.includes('import')) {
        return 'import-statement';
      }
      return 'import-statement'; // Default fallback
  }
}

/**
 * Specialized BasicTree node for bundle stats with typed values
 */
export interface BundleStatsNode extends BasicTreeNode {
  values?: {
    bytes?: string;
    imports?: string;
    files?: string;
    type?: string;
  };
  children?: BundleStatsNode[];
}

/**
 * Import with type information
 */
export interface ImportWithType {
  path: string;
  type?: ImportKind;
}

/**
 * Creates a BasicTree structure for bundle stats
 */
function createBundleStatsTree(
  inputs: Record<
    string,
    { bytes: number; imports: (string | ImportWithType)[] }
  >,
  outputs: Record<string, { bytes: number; inputs: Record<string, number> }>,
  title: string,
): BasicTree {
  const children: BundleStatsNode[] = [];

  if (inputs && Object.keys(inputs).length > 0) {
    const inputsChildren = Object.entries(inputs).map(([filename, data]) => ({
      name: filename,
      values: {
        bytes: String(data.bytes),
        imports: String(data.imports.length),
      },
      children:
        data.imports.length > 0
          ? data.imports.map((imp: string | ImportWithType) => {
              if (typeof imp === 'string') {
                return {
                  name: `→ ${imp}`,
                  values: {},
                };
              } else {
                return {
                  name: `→ ${imp.path}`,
                  values: {
                    type: imp.type || 'unknown',
                  },
                };
              }
            })
          : undefined,
    }));

    children.push({
      name: 'inputs',
      values: { files: String(inputsChildren.length) },
      children: inputsChildren,
    });
  }

  if (outputs && Object.keys(outputs).length > 0) {
    const outputsChildren = Object.entries(outputs).map(([filename, data]) => ({
      name: filename,
      values: { bytes: String(data.bytes) },
      children: Object.entries(data.inputs || {}).map(
        ([inputFile, inputBytes]) => ({
          name: `← ${inputFile}`,
          values: { bytes: String(inputBytes) },
        }),
      ),
    }));

    children.push({
      name: 'outputs',
      values: { files: String(outputsChildren.length) },
      children: outputsChildren,
    });
  }

  return {
    title,
    type: 'basic' as const,
    root: { name: 'bundle', values: {}, children },
  };
}

export type EsBuildCoreStats = {
  inputs: Record<
    string,
    {
      format?: 'esm' | 'cjs';
      bytes: number;
      imports: { path: string; kind: ImportKind }[];
    }
  >;
  outputs: Record<
    string,
    {
      bytes: number;
      inputs: Record<string, { bytesInOutput: number }>;
    }
  >;
};

export function unifyEsbuild(stats: EsBuildCoreStats): BasicTree {
  const inputs: Record<string, { bytes: number; imports: ImportWithType[] }> =
    {};
  const outputs: Record<
    string,
    { bytes: number; inputs: Record<string, number> }
  > = {};

  if (stats.inputs) {
    for (const [filePath, input] of Object.entries(stats.inputs)) {
      inputs[filePath] = {
        bytes: input.bytes,
        imports:
          input.imports?.map(imp => ({
            path: imp.path,
            type: imp.kind,
          })) || [],
      };
    }
  }

  if (stats.outputs) {
    for (const [filePath, output] of Object.entries(stats.outputs)) {
      outputs[filePath] = {
        bytes: output.bytes,
        inputs: {},
      };

      if (output.inputs) {
        for (const [inputPath, inputData] of Object.entries(output.inputs)) {
          outputs[filePath].inputs[inputPath] = inputData.bytesInOutput;
        }
      }
    }
  }

  return createBundleStatsTree(inputs, outputs, 'ESBuild Bundle Stats');
}

export type BundlerAssetsCoreStats = {
  assets: Array<{ name: string; size: number }>;
  modules: Array<{
    name: string;
    size: number;
  }>;
  chunks?: Array<{
    files: string[];
    modules?: Array<{
      name: string;
      size: number;
    }>;
  }>;
};

export type WebpackCoreStats = {
  assets: Array<{ name: string; size: number }>;
  modules: Array<{
    name: string;
    size: number;
    moduleType?: string;
    reasons?: Array<{
      type: string;
      userRequest?: string;
      moduleName?: string;
    }>;
  }>;
  chunks?: Array<{
    files: string[];
    modules?: Array<{
      name: string;
      size: number;
      moduleType?: string;
    }>;
  }>;
};

export function unifyWebpack(stats: WebpackCoreStats): BasicTree {
  const inputs: Record<string, { bytes: number; imports: ImportWithType[] }> =
    {};
  const outputs: Record<
    string,
    { bytes: number; inputs: Record<string, number> }
  > = {};

  if (stats.modules) {
    // First pass: Initialize all modules with empty imports
    for (const module of stats.modules) {
      if (module.moduleType === 'runtime') continue;

      const cleanName = cleanModulePath(module.name);
      inputs[cleanName] = {
        bytes: module.size,
        imports: [],
      };
    }

    // Second pass: Build dependency relationships correctly
    for (const module of stats.modules) {
      if (module.moduleType === 'runtime') continue;

      if (module.reasons) {
        for (const reason of module.reasons) {
          if (
            (reason.type === 'harmony side effect evaluation' ||
              reason.type === 'harmony import specifier' ||
              reason.type === 'dynamic import' ||
              reason.type === 'import()' ||
              reason.type === 'cjs require' ||
              reason.type === 'require call' ||
              reason.type === 'require.resolve' ||
              reason.type === 'css @import' ||
              reason.type === 'css url()' ||
              reason.type === 'entry' ||
              reason.type === 'commonjs require' ||
              reason.type === 'amd require' ||
              reason.type === 'context element' ||
              reason.type === 'delegated source' ||
              reason.type === 'delegated exports' ||
              reason.type === 'module hot accepted' ||
              reason.type === 'module hot declined') &&
            reason.userRequest &&
            reason.moduleName &&
            reason.userRequest !== module.name
          ) {
            // The "reason" tells us that reason.moduleName imports this module
            // So we add this module to reason.moduleName's imports list
            const importingModule = cleanModulePath(reason.moduleName);
            let importedModule = cleanModulePath(reason.userRequest);

            // Handle relative imports
            if (importedModule.startsWith('./')) {
              const importingModuleDir = importingModule
                .split('/')
                .slice(0, -1)
                .join('/');
              if (importingModuleDir) {
                importedModule =
                  importingModuleDir + '/' + importedModule.slice(2);
              }
            }

            // Add the import relationship with type information
            if (inputs[importingModule]) {
              const importType = mapWebpackTypeToImportKind(reason.type);
              const existingImport = inputs[importingModule].imports.find(
                imp => imp.path === importedModule && imp.type === importType,
              );

              if (!existingImport) {
                inputs[importingModule].imports.push({
                  path: importedModule,
                  type: importType,
                });
              }
            }
          }
        }
      }
    }
  }

  if (stats.assets) {
    for (const asset of stats.assets) {
      const assetInputs: Record<string, number> = {};

      if (stats.chunks) {
        for (const chunk of stats.chunks) {
          if (chunk.files?.includes(asset.name)) {
            for (const module of chunk.modules || []) {
              if (module.moduleType !== 'runtime') {
                const cleanName = cleanModulePath(module.name);
                assetInputs[cleanName] = module.size;
              }
            }
          }
        }
      }

      outputs[asset.name] = {
        bytes: asset.size,
        inputs: assetInputs,
      };
    }
  }

  return createBundleStatsTree(inputs, outputs, 'Webpack Bundle Stats');
}

export type RsbuildCoreStats = {
  assets: Array<{ name: string; size: number }>;
  modules: Array<{
    name: string;
    size: number;
    moduleType?: string;
    reasons?: Array<{
      type: string;
      userRequest?: string;
      moduleName?: string;
    }>;
  }>;
  chunks?: Array<{
    files: string[];
    modules?: Array<{
      name: string;
      size: number;
      moduleType?: string;
    }>;
  }>;
};

export function unifyRsbuild(stats: RsbuildCoreStats): BasicTree {
  const inputs: Record<string, { bytes: number; imports: ImportWithType[] }> =
    {};
  const outputs: Record<
    string,
    { bytes: number; inputs: Record<string, number> }
  > = {};

  if (stats.modules) {
    // First pass: Initialize all modules with empty imports
    for (const module of stats.modules) {
      if (module.moduleType === 'runtime') continue;

      const cleanName = cleanModulePath(module.name);
      inputs[cleanName] = {
        bytes: module.size,
        imports: [],
      };
    }

    // Second pass: Build dependency relationships correctly
    for (const module of stats.modules) {
      if (module.moduleType === 'runtime') continue;

      if (module.reasons) {
        for (const reason of module.reasons) {
          if (
            (reason.type === 'esm import' ||
              reason.type === 'esm import specifier' ||
              reason.type === 'dynamic import' ||
              reason.type === 'import()' ||
              reason.type === 'cjs require' ||
              reason.type === 'require call' ||
              reason.type === 'require.resolve' ||
              reason.type === 'require.resolve context' ||
              reason.type === 'css @import' ||
              reason.type === 'css url()' ||
              reason.type === 'entry' ||
              reason.type === 'extract css' ||
              reason.type === 'commonjs require' ||
              reason.type === 'amd require' ||
              reason.type === 'context element' ||
              reason.type === 'delegated source' ||
              reason.type === 'delegated exports' ||
              reason.type === 'harmony side effect evaluation' ||
              reason.type === 'harmony import specifier' ||
              reason.type === 'harmony export imported specifier' ||
              reason.type === 'module hot accepted' ||
              reason.type === 'module hot declined') &&
            reason.userRequest &&
            reason.moduleName &&
            reason.userRequest !== module.name
          ) {
            // The "reason" tells us that reason.moduleName imports this module
            // So we add this module to reason.moduleName's imports list
            const importingModule = cleanModulePath(reason.moduleName);
            let importedModule = cleanModulePath(reason.userRequest);

            // Handle relative imports
            if (importedModule.startsWith('./')) {
              const importingModuleDir = importingModule
                .split('/')
                .slice(0, -1)
                .join('/');
              if (importingModuleDir) {
                importedModule =
                  importingModuleDir + '/' + importedModule.slice(2);
              }
            }

            // Add the import relationship with type information
            if (inputs[importingModule]) {
              const importType = mapWebpackTypeToImportKind(reason.type);
              const existingImport = inputs[importingModule].imports.find(
                imp => imp.path === importedModule && imp.type === importType,
              );

              if (!existingImport) {
                inputs[importingModule].imports.push({
                  path: importedModule,
                  type: importType,
                });
              }
            }
          }
        }
      }
    }
  }

  if (stats.assets) {
    for (const asset of stats.assets) {
      if (!asset.name.endsWith('.js')) continue;

      const assetInputs: Record<string, number> = {};

      if (stats.chunks) {
        for (const chunk of stats.chunks) {
          if (chunk.files?.includes(asset.name)) {
            for (const module of chunk.modules || []) {
              if (module.moduleType !== 'runtime') {
                const cleanName = cleanModulePath(module.name);
                assetInputs[cleanName] = module.size;
              }
            }
          }
        }
      }

      outputs[asset.name] = {
        bytes: asset.size,
        inputs: assetInputs,
      };
    }
  }

  return createBundleStatsTree(inputs, outputs, 'Rsbuild Bundle Stats');
}

/**
 * Cleans and normalizes module paths for better readability
 */
function cleanModulePath(path: string): string {
  // Remove loader chains and keep just the actual file path
  if (path.includes('!')) {
    const parts = path.split('!');
    const actualFile = parts[parts.length - 1];
    if (
      actualFile &&
      (actualFile.startsWith('./') || actualFile.startsWith('../'))
    ) {
      return actualFile;
    }
  }

  // Clean up <CWD> placeholder
  if (path.includes('<CWD>')) {
    path = path.replace(/<CWD>/g, '.');
  }

  // Simplify node_modules paths
  if (path.includes('node_modules')) {
    const nodeModulesMatch = path.match(/node_modules\/([^\/]+)/);
    if (nodeModulesMatch) {
      return `~${nodeModulesMatch[1]}`;
    }
  }

  // Remove CSS extraction prefixes
  if (path.startsWith('css ')) {
    path = path.substring(4);
    // Try to extract the actual file from CSS loader chains
    if (path.includes('!./')) {
      const match = path.match(/!\.(\/[^!]+)$/);
      if (match) {
        return `.${match[1]}`;
      }
    }
  }

  // Clean up webpack loader syntax
  path = path.replace(/\?\?[^!]+/g, ''); // Remove loader options
  path = path.replace(/^-!/, ''); // Remove negative loader prefix

  // Simplify very long paths
  if (path.length > 80) {
    const fileName = path.split('/').pop() || path;
    if (fileName.length < 40) {
      return `.../${fileName}`;
    }
  }

  return path;
}
