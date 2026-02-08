import type { ProjectConfiguration, Tree } from '@nx/devkit';
import { dirname } from 'path';
import type { RootBuilder } from './builder-system';
import { createRootBuilder } from './builder-system';
import { resolveMutations } from './mutation-system';
import {
  dedupeImports,
  projectSubstitutions,
  substituteImportPaths,
  substituteVariables,
} from './substitution';
import {
  detectExportDefault,
  extractImports,
  rawCode,
  readTsConfig,
  serializeTsConfig,
} from './ts-config';
import type {
  BaselineConfig,
  Diagnostic,
  SyncResult,
  TreeWithBaselineContext,
} from './types';
import { findMatchingFile } from './utils';

// Re-export projectSubstitutions for use in baseline.json.ts
export { projectSubstitutions };

// Re-export rawCode helper for use in baseline definitions
export { rawCode };

/**
 * Context information passed to baseline functions
 */
export type BaselineContext = {
  /**
   * The project name being processed
   */
  projectName: string;
  /**
   * The project root path relative to workspace root
   */
  projectRoot: string;
  /**
   * The workspace root path
   */
  workspaceRoot: string;
  /**
   * The full project configuration from Nx
   */
  projectConfig?: ProjectConfiguration;
  /**
   * The file path being processed
   */
  filePath: string;
};

/**
 * Options for creating a TypeScript baseline
 */
export type TsBaselineOptions<T> = {
  matcher: string | string[];
  fileName: string;
  projects?: string[];
  baseline: (root: RootBuilder<T>, ctx?: BaselineContext) => void;
  preserveImports?: boolean;
  /**
   * Imports to use when preserveImports is false.
   */
  fallbackImports?: string[];
  /**
   * Controls how export default is generated.
   */
  exportDefault?: {
    /**
     * Wrap the config object with a helper, e.g. "defineConfig".
     */
    wrapper?: string;
    /**
     * Add these imports to the output (deduped).
     */
    imports?: string[];
    /**
     * Override the satisfies type. Use false to omit.
     */
    satisfiesType?: string | false;
  };
};

/**
 * Creates a TypeScript baseline configuration
 * Similar to createJsonBaselineTyped but for TS files
 */
export const createTsBaseline = <T extends object>(
  options: TsBaselineOptions<T>,
): BaselineConfig => {
  const matchers = Array.isArray(options.matcher)
    ? options.matcher
    : [options.matcher];

  return {
    projects: options.projects,
    filePath: options.fileName,
    matcher: options.matcher,
    sync(tree: TreeWithBaselineContext): SyncResult {
      let diagnostics: Diagnostic[] = [];

      // When matcher contains path separators, extract just the filename for scoped tree matching
      const scopedMatchers = matchers.map(m => {
        if (m.includes('/')) {
          // Extract filename from path pattern (e.g., '**/workspace-baseline/vitest.unit.config.ts' -> 'vitest.unit.config.ts')
          return m.split('/').pop() || m;
        }
        return m;
      });

      const path = findMatchingFile(
        tree as Tree & { children?: (path: string) => string[] },
        scopedMatchers,
      );

      if (!path) {
        return { diagnostics };
      }

      // Extract baseline context from tree
      const treeContext =
        tree.__baselineContext || (tree as any).__baselineContext;

      // Create baseline context for the baseline function
      const baselineContext: BaselineContext = {
        projectName: treeContext?.projectName || 'unknown',
        projectRoot: treeContext?.projectRoot || dirname(path),
        workspaceRoot: treeContext?.workspaceRoot || process.cwd(),
        filePath: path,
        // projectConfig can be added by the caller if needed
        projectConfig: undefined,
      };

      // Build the baseline with context
      const rootBuilder = createRootBuilder<T>();
      options.baseline(rootBuilder, baselineContext);
      const updater = rootBuilder.__updater;

      // Read the original file to extract imports
      const originalContentBuffer = tree.read(path);
      const originalContent = originalContentBuffer
        ? typeof originalContentBuffer === 'string'
          ? originalContentBuffer
          : originalContentBuffer.toString('utf-8')
        : '';
      const baseImports =
        options.preserveImports !== false
          ? extractImports(originalContent)
          : (options.fallbackImports ?? [
              "import type { UserConfig as ViteUserConfig } from 'vitest/config';",
            ]);
      const imports = substituteImportPaths(
        dedupeImports([
          ...baseImports,
          ...(options.exportDefault?.imports ?? []),
        ]),
        path,
        tree,
      );

      const detectedExport = detectExportDefault(originalContent);
      const satisfiesType =
        options.exportDefault?.satisfiesType === false
          ? undefined
          : (options.exportDefault?.satisfiesType ??
            detectedExport.satisfiesType ??
            'ViteUserConfig');
      const wrapper = options.exportDefault?.wrapper ?? detectedExport.wrapper;

      // Read current config as object or array
      let current: T;
      try {
        current = readTsConfig<T>(tree, path);
      } catch (error) {
        // If parsing fails, start with empty object or array
        // Try to detect if we're dealing with an array config
        current = (originalContent.includes('.config(') ? [] : {}) as T;
      }

      // Apply baseline mutations
      const result = updater(current as any, '');
      diagnostics = [...diagnostics, ...result.diagnostics];

      // Resolve any remaining mutation objects to their actual values
      let finalValue = resolveMutations(result.value);

      // Apply project substitutions to all string values
      finalValue = substituteVariables(
        finalValue,
        projectSubstitutions,
        path,
        tree,
      );

      // Serialize back to TypeScript
      const tsContent = serializeTsConfig(
        finalValue as Record<string, unknown> | unknown[],
        {
          imports,
          satisfiesType,
          wrapper,
        },
      );

      // Note: We don't write to the tree here - that's done by the sync command
      // Check if this is a rename scenario
      const pathFileName = path.split('/').pop() || '';
      const isRename = pathFileName !== options.fileName;

      return {
        diagnostics,
        matchedFile: path,
        baselineValue: finalValue as Record<string, unknown> | undefined,
        formattedContent: tsContent,
        ...(isRename ? { renamedFrom: path } : {}),
      };
    },
  };
};
