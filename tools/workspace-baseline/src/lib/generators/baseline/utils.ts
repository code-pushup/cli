import type { ProjectGraph, ProjectGraphProjectNode, Tree } from '@nx/devkit';
import { readJson } from '@nx/devkit';
import { minimatch } from 'minimatch';
import { createHash } from 'node:crypto';
import * as path from 'node:path';

export function normalizeItemOrArray<T>(itemOrArray: T | T[]): T[];
export function normalizeItemOrArray<T>(
  itemOrArray: T | T[] | undefined,
): T[] | undefined {
  if (itemOrArray == null) {
    return undefined;
  }
  if (Array.isArray(itemOrArray)) {
    return itemOrArray;
  }
  return [itemOrArray];
}
export function formatObjectToFormattedJsString(
  jsonObj?:
    | {
        [key: string]: unknown;
      }
    | unknown[],
): string | undefined {
  if (!jsonObj) {
    return;
  }
  const jsonString = JSON.stringify(jsonObj, null, 2);
  return jsonString.replace(/"(\w+)":/g, '$1:');
}
export function formatArrayToLinesOfJsString(
  lines?: string[],
  separator = '\n',
) {
  if (lines == null || lines.length === 0) {
    return;
  }
  return lines.join(separator).replace(/'/g, '"');
}
export function formatArrayToJSArray(lines?: string[]) {
  if (!Array.isArray(lines)) {
    return;
  }
  return `[${formatArrayToLinesOfJsString(lines, ',\n') ?? ''}]`.replace(
    /"/g,
    '',
  );
}

/**
 * Filters projects from project graph using Nx filter syntax.
 *
 * Supported filters:
 * - `--tags=<tag>`: Filter by project tags (project must have the tag)
 * - `--exclude=<pattern>`: Exclude projects matching the pattern (glob)
 * - Project names: Direct project name matching
 *
 * @param graph - The project graph
 * @param filters - Array of filter strings
 * @returns Filtered array of project nodes
 */
export function filterProjectsByNxFilter(
  graph: ProjectGraph,
  filters: string[] = [],
): ProjectGraphProjectNode[] {
  let projects = Object.values(graph.nodes);

  if (filters.length === 0) {
    return projects;
  }

  for (const filter of filters) {
    if (filter.startsWith('--tags=')) {
      const tag = filter.replace('--tags=', '');
      projects = projects.filter(project => {
        const projectTags = project.data.tags || [];
        return projectTags.includes(tag);
      });
    } else if (filter.startsWith('--exclude=')) {
      const pattern = filter.replace('--exclude=', '');
      projects = projects.filter(project => {
        if (!project.name) {
          return true;
        }
        return !minimatch(project.name, pattern);
      });
    } else if (filter.startsWith('--')) {
      // Skip other Nx flags we don't support yet (like --affected)
      // Could be extended in the future
      continue;
    } else {
      // Direct project name matching
      projects = projects.filter(project => project.name === filter);
    }
  }

  return projects;
}

/**
 * Finds all tsconfig files in a project directory matching a glob pattern.
 *
 * @param tree - The Nx Tree
 * @param projectRoot - The project root directory
 * @param pattern - Optional glob pattern to match tsconfig files (default: "tsconfig*.json")
 * @returns Array of tsconfig file paths relative to project root
 */
export function findTsconfigFilesInProject(
  tree: Tree,
  projectRoot: string,
  pattern: string = 'tsconfig*.json',
): string[] {
  const files: string[] = [];

  // List all files in the project root
  try {
    const projectFiles = tree.children(projectRoot);
    for (const file of projectFiles) {
      const filePath = path.join(projectRoot, file);
      // Check if it's a tsconfig file and matches the pattern
      if (
        file.startsWith('tsconfig') &&
        file.endsWith('.json') &&
        minimatch(file, pattern)
      ) {
        files.push(file);
      }
    }
  } catch {
    // If project root doesn't exist or can't be read, return empty array
    return [];
  }

  return files.sort();
}

/**
 * Formats a value for use in TypeScript code.
 */
function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return `'${value}'`;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    return `[${value.map(v => formatValue(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }
    // Sort object keys for consistent ordering in nested objects (e.g., paths in compilerOptions)
    const sortedEntries = entries.sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB),
    );
    return `{ ${sortedEntries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ')} }`;
  }
  return JSON.stringify(value);
}

/**
 * Formats compiler options for the baseline file.
 * Sorts entries by key for consistent deduplication.
 */
function formatCompilerOptions(
  compilerOptions: Record<string, unknown> | undefined,
): string {
  if (!compilerOptions || Object.keys(compilerOptions).length === 0) {
    return '// Add baseline compiler options here';
  }

  // Sort entries by key for consistent ordering and better deduplication
  const entries = Object.entries(compilerOptions)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      // Handle special cases
      if (key === 'types' && Array.isArray(value)) {
        // Sort types array for consistent ordering
        const sortedTypes = [...value].sort();
        return `types: [${sortedTypes.map(v => `'${v}'`).join(', ')}]`;
      }
      return `${key}: ${formatValue(value)}`;
    })
    .join(',\n    ');

  return entries;
}

/**
 * Converts a relative path (starting with ../) to repo: format.
 * Example: '../../tsconfig.base.json' -> 'repo:tsconfig.base.json'
 */
function convertToRepoPath(pathStr: string): string {
  if (pathStr.startsWith('../')) {
    // Remove all '../' prefixes (can be multiple) and add 'repo:' prefix
    const repoPath = pathStr.replace(/^(\.\.\/)+/, '');
    return `repo:${repoPath}`;
  }
  return pathStr;
}

/**
 * Normalizes an extends path to repo: format for better deduplication.
 * This helps reduce the number of unique baselines by normalizing equivalent paths.
 * Examples:
 * - '../../tsconfig.base.json' -> 'repo:tsconfig.base.json'
 * - './tsconfig.json' -> 'repo:tsconfig.json'
 * - 'tsconfig.json' -> 'repo:tsconfig.json' (for tsconfig files in same directory)
 */
function normalizeExtendsPath(pathStr: string): string {
  // Normalize paths starting with ../ to repo: format
  if (pathStr.startsWith('../')) {
    const repoPath = pathStr.replace(/^(\.\.\/)+/, '');
    return `repo:${repoPath}`;
  }
  // Normalize paths starting with ./ to repo: format (same directory)
  // This helps deduplicate baselines where ./tsconfig.json and tsconfig.json are equivalent
  if (pathStr.startsWith('./')) {
    const repoPath = pathStr.replace(/^\.\//, '');
    return `repo:${repoPath}`;
  }
  // Normalize simple tsconfig filenames to repo: format for consistency
  // This helps when extends is just "tsconfig.json" (same directory reference)
  if (!pathStr.includes('/') && pathStr.match(/^tsconfig.*\.json$/)) {
    return `repo:${pathStr}`;
  }
  return pathStr;
}

/**
 * Formats include/exclude arrays for the baseline file.
 * Assumes paths are already normalized (should be called after normalization).
 */
function formatIncludeExclude(
  arr: string[] | undefined,
  arrName: string,
): string {
  if (!arr || arr.length === 0) {
    return '';
  }
  // Paths should already be normalized before calling this function
  return `${arrName}: arr.add(${arr.map(v => `'${v}'`).join(', ')})`;
}

/**
 * Normalizes content for consistent comparison by trimming whitespace
 * and normalizing line endings.
 *
 * @param content - The content to normalize
 * @returns Normalized content string
 */
function normalizeContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim();
}

/**
 * Generates a content hash for baseline file deduplication.
 *
 * @param content - The baseline file content to hash
 * @returns First 8 characters of SHA-256 hash (hex)
 */
function generateContentHash(content: string): string {
  const normalized = normalizeContent(content);
  return createHash('sha256').update(normalized).digest('hex').substring(0, 8);
}

/**
 * Finds an existing baseline file with identical content.
 *
 * @param tree - The Nx Tree
 * @param baselineDir - The baseline directory path
 * @param content - The content to search for
 * @returns Path to existing file with matching content, or undefined if not found
 */
function findExistingBaselineWithContent(
  tree: Tree,
  baselineDir: string,
  content: string,
): string | undefined {
  const normalizedContent = normalizeContent(content);

  try {
    const files = tree.children(baselineDir);
    for (const file of files) {
      // Only check baseline.ts files
      if (file.endsWith('.baseline.ts')) {
        const filePath = path.join(baselineDir, file);
        try {
          const existingContent = tree.read(filePath)?.toString();
          if (
            existingContent &&
            normalizeContent(existingContent) === normalizedContent
          ) {
            return filePath;
          }
        } catch {
          // Skip files that can't be read
          continue;
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return undefined;
  }

  return undefined;
}

/**
 * Result of creating a baseline file.
 */
export type BaselineFileResult =
  | { path: string; reused: true }
  | { path: string; reused: false };

/**
 * Creates a baseline configuration file for a tsconfig file.
 *
 * @param tree - The Nx Tree
 * @param tsconfigFileName - The tsconfig file name (e.g., "tsconfig.lib.json")
 * @param tsconfigPath - The full path to the tsconfig file
 * @param baselineDir - The baseline directory path
 * @param skipExisting - If true, skip creation if baseline file already exists
 * @returns The result containing the path and whether an existing file was reused, or undefined if skipped
 */
export function createBaselineFile(
  tree: Tree,
  tsconfigFileName: string,
  tsconfigPath: string,
  baselineDir: string,
  skipExisting: boolean = false,
): BaselineFileResult | undefined {
  // Extract the name part from tsconfig file name
  // tsconfig.lib.json -> tsconfig.lib.baseline.ts
  // tsconfig.json -> tsconfig.baseline.ts
  const match = tsconfigFileName.match(/^tsconfig(\.(.+))?\.json$/);
  const baseBaselineName = match
    ? match[2]
      ? `tsconfig.${match[2]}.baseline`
      : 'tsconfig.baseline'
    : `tsconfig.${tsconfigFileName.replace(/\.json$/, '')}.baseline`;

  // Extract the file matcher pattern for createTsconfigBase
  const fileMatcher = match
    ? match[2]
      ? `tsconfig.${match[2]}.json`
      : 'tsconfig.json'
    : tsconfigFileName;

  // Read the actual tsconfig file
  let tsconfig: {
    extends?: string;
    compilerOptions?: Record<string, unknown>;
    include?: string[];
    exclude?: string[];
  } = {};

  try {
    if (tree.exists(tsconfigPath)) {
      tsconfig = readJson(tree, tsconfigPath);
    }
  } catch (error) {
    // If we can't read the file, continue with empty config
  }

  // Build the baseline configuration
  const configParts: string[] = [];

  // Add extends if present, normalizing paths to repo: format for better deduplication
  if (tsconfig.extends) {
    const extendsPath = normalizeExtendsPath(tsconfig.extends);
    configParts.push(`extends: '${extendsPath}'`);
  }

  // Add compilerOptions
  const compilerOptionsStr = formatCompilerOptions(tsconfig.compilerOptions);
  if (compilerOptionsStr && !compilerOptionsStr.includes('// Add baseline')) {
    configParts.push(
      `compilerOptions: obj.add({\n    ${compilerOptionsStr}\n  })`,
    );
  } else {
    configParts.push(
      `compilerOptions: obj.add({\n    // Add baseline compiler options here\n  })`,
    );
  }

  // Add include if present (normalize paths first, then sort for consistent deduplication)
  if (tsconfig.include && tsconfig.include.length > 0) {
    // Normalize paths first, then sort to ensure arrays with same items in different order match
    const normalizedInclude = tsconfig.include.map(path =>
      convertToRepoPath(path),
    );
    const sortedInclude = normalizedInclude.sort();
    configParts.push(formatIncludeExclude(sortedInclude, 'include'));
  }

  // Add exclude if present (normalize paths first, then sort for consistent deduplication)
  if (tsconfig.exclude && tsconfig.exclude.length > 0) {
    // Normalize paths first, then sort to ensure arrays with same items in different order match
    const normalizedExclude = tsconfig.exclude.map(path =>
      convertToRepoPath(path),
    );
    const sortedExclude = normalizedExclude.sort();
    configParts.push(formatIncludeExclude(sortedExclude, 'exclude'));
  }

  // Determine imports needed
  const needsArr = tsconfig.include || tsconfig.exclude;
  const imports = needsArr
    ? `import { createJsonBaselineTyped } from '../src/lib/baseline/baseline.json';\nimport { arr, obj } from '../src/lib/baseline/baseline.json';`
    : `import { createJsonBaselineTyped } from '../src/lib/baseline/baseline.json';\nimport { obj } from '../src/lib/baseline/baseline.json';`;

  // Generate baseline file content
  const baselineContent = `${imports}

export const tsconfig${match && match[2] ? match[2].charAt(0).toUpperCase() + match[2].slice(1) : ''}Base = createJsonBaselineTyped({
  matcher: '${fileMatcher}',
  fileName: '${fileMatcher}',
  baseline: root => root.set({
  ${configParts.join(',\n  ')},
}),
});
`;

  // Check if identical content already exists
  const existingBaselinePath = findExistingBaselineWithContent(
    tree,
    baselineDir,
    baselineContent,
  );

  if (existingBaselinePath) {
    // Content already exists, return existing file path
    return { path: existingBaselinePath, reused: true };
  }

  // Generate content-based filename with hash
  const contentHash = generateContentHash(baselineContent);
  const baselineName = `${baseBaselineName}.${contentHash}.ts`;
  const baselinePath = path.join(baselineDir, baselineName);

  // Check if baseline file already exists (for content-based names with skipExisting)
  if (skipExisting && tree.exists(baselinePath)) {
    return undefined;
  }

  // Write the baseline file
  tree.write(baselinePath, baselineContent);

  return { path: baselinePath, reused: false };
}

/**
 * Creates a constants file with sane defaults for baseline configurations.
 *
 * @param tree - The Nx Tree
 * @param baselineDir - The baseline directory path
 * @param skipExisting - If true, skip creation if constants file already exists
 * @returns The path to the constants file, or undefined if skipped
 */
export function createConstantsFile(
  tree: Tree,
  baselineDir: string,
  skipExisting: boolean = false,
): string | undefined {
  const constantsPath = path.join(baselineDir, 'constants.ts');

  // Check if constants file already exists
  if (skipExisting && tree.exists(constantsPath)) {
    return undefined;
  }

  const constantsContent = `// ============================================================================
// Compiler Options
// ============================================================================

/** Default output directory for nested projects (2 levels deep) */
export const DEFAULT_OUT_DIR = '../../dist/out-tsc';

/** Output directory for root-level projects */
export const ROOT_OUT_DIR = './dist/';

// ============================================================================
// Type Definitions
// ============================================================================

/** Node.js types */
export const NODE_TYPES = ['node'] as const;

/** Vitest types for globals and importMeta */
export const VITEST_TYPES = ['vitest/globals', 'vitest/importMeta'] as const;

/** Additional Vitest type */
export const VITEST_TYPE = 'vitest';

/** Vite client types */
export const VITE_CLIENT_TYPES = ['vite/client'] as const;

/** NodeNext types for tools */
export const NODENEXT_TYPES = ['nodenext'] as const;

/** Base Vitest types (for base configs) */
export const BASE_VITEST_TYPES = ['vitest'] as const;

// ============================================================================
// Common Type Combinations
// ============================================================================

/** Types for test configurations */
export const TEST_TYPES = [
  ...VITEST_TYPES,
  ...VITE_CLIENT_TYPES,
  ...NODE_TYPES,
] as const;

/** Types for spec configurations */
export const SPEC_TYPES = [
  ...VITEST_TYPES,
  ...VITE_CLIENT_TYPES,
  ...NODE_TYPES,
  VITEST_TYPE,
] as const;

// ============================================================================
// Extends
// ============================================================================

/** Standard extends path for nested configs */
export const EXTENDS_TSCONFIG_JSON = './tsconfig.json';

// ============================================================================
// Include Patterns
// ============================================================================

/** Source files pattern */
export const SRC_INCLUDE = 'src/**/*.ts';

/** Vitest config files pattern */
export const VITEST_CONFIG_PATTERN = 'vitest.*.config.ts';

/** Unit test config */
export const VITEST_UNIT_CONFIG = 'vitest.unit.config.ts';

/** Integration test config */
export const VITEST_INT_CONFIG = 'vitest.int.config.ts';

/** E2E test config */
export const VITEST_E2E_CONFIG = 'vitest.e2e.config.ts';

/** Vite config files */
export const VITE_CONFIG_FILES = [
  'vite.config.ts',
  'vite.config.mts',
  'vitest.config.ts',
  'vitest.config.mts',
] as const;

/** Test file patterns */
export const TEST_FILE_PATTERNS = [
  'src/**/*.test.ts',
  'src/**/*.test.tsx',
  'src/**/*.test.js',
  'src/**/*.test.jsx',
] as const;

/** Spec file patterns */
export const SPEC_FILE_PATTERNS = [
  'src/**/*.spec.ts',
  'src/**/*.spec.tsx',
  'src/**/*.spec.js',
  'src/**/*.spec.jsx',
] as const;

/** Declaration files pattern */
export const DECLARATION_FILES = 'src/**/*.d.ts';

/** Mocks pattern */
export const MOCKS_PATTERN = 'mocks/**/*.ts';

/** Tests directory patterns (for e2e) */
export const TESTS_DIR_PATTERNS = [
  'tests/**/*.test.ts',
  'tests/**/*.d.ts',
] as const;

/** Performance test files */
export const PERF_PATTERN = 'perf/**/*.ts';

/** Tools config files */
export const TOOLS_CONFIG_FILES = ['zod2md.config.ts'] as const;

/** Repo root path for vitest setup (auto-resolves based on project depth) */
export const REPO_VITEST_SETUP = 'repo:testing/test-setup/src/vitest.d.ts';

// ============================================================================
// Exclude Patterns
// ============================================================================

/** Vitest config files to exclude */
export const EXCLUDE_VITEST_CONFIGS = [
  'vitest.unit.config.ts',
  'vitest.int.config.ts',
] as const;

/** Test files to exclude */
export const EXCLUDE_TEST_FILES = ['src/**/*.test.ts'] as const;

/** Mock files to exclude */
export const EXCLUDE_MOCK_FILES = [
  'src/**/*.mock.ts',
  'mocks/**/*.ts',
] as const;

// ============================================================================
// Common Include Arrays
// ============================================================================

/** Default test includes (for e2e tests) */
export const DEFAULT_TEST_INCLUDES = [
  VITEST_CONFIG_PATTERN,
  ...TESTS_DIR_PATTERNS,
  MOCKS_PATTERN,
  REPO_VITEST_SETUP,
] as const;

/** Standard test includes (for unit/integration tests) */
export const STANDARD_TEST_INCLUDES = [
  VITEST_UNIT_CONFIG,
  VITEST_INT_CONFIG,
  MOCKS_PATTERN,
  ...TEST_FILE_PATTERNS,
  DECLARATION_FILES,
  REPO_VITEST_SETUP,
] as const;

/** Spec includes (for spec configs) */
export const SPEC_INCLUDES = [
  ...VITE_CONFIG_FILES,
  VITEST_UNIT_CONFIG,
  ...TEST_FILE_PATTERNS,
  ...SPEC_FILE_PATTERNS,
  DECLARATION_FILES,
  REPO_VITEST_SETUP,
] as const;

/** Library includes */
export const LIB_INCLUDES = [SRC_INCLUDE] as const;

/** Library excludes */
export const LIB_EXCLUDES = [
  ...EXCLUDE_VITEST_CONFIGS,
  ...EXCLUDE_TEST_FILES,
  ...EXCLUDE_MOCK_FILES,
] as const;
`;

  // Write the constants file
  tree.write(constantsPath, constantsContent);

  return constantsPath;
}
