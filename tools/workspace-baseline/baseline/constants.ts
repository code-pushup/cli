// ============================================================================
// Nx Interpolation Support
// ============================================================================
//
// Constants in this file support Nx-style interpolation placeholders:
// - {workspaceRoot} - Workspace root directory (e.g., '/path/to/repo')
// - {projectRoot} - Project root directory (e.g., 'packages/utils')
// - {projectName} - Project name extracted from path (e.g., 'utils')
// - {packageName} - Package name extracted from path (alias for {projectName})
//
// These placeholders are automatically resolved by the baseline sync system
// and work in both JSON and TypeScript config files.
//
// ============================================================================
//
// NOTE: Most constants have been moved to specific baseline helper files:
// - TsConfig-related: baseline.tsconfig.ts
// - Vitest-related: baseline.vitest.ts
// - Package.json-related: baseline.package-json.ts
// - ESLint-related: baseline.eslint.ts
//
// ============================================================================

// ============================================================================
// General Configuration
// ============================================================================

/** Vite config files */
export const VITE_CONFIG_FILES = [
  'vite.config.ts',
  'vite.config.mts',
  'vitest.config.ts',
  'vitest.config.mts',
] as const;

/** Repo root path for vitest setup (auto-resolves based on project depth) */
export const REPO_VITEST_SETUP = 'repo:testing/test-setup/src/vitest.d.ts';

// ============================================================================
// Re-exports for backward compatibility with old/ directory
// ============================================================================
// These are re-exported from the specific baseline helper files for backward
// compatibility with files in the old/ directory. New baselines should import
// directly from the appropriate baseline helper file.

export {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  LIB_EXCLUDES,
  LIB_INCLUDES,
  NODE_TYPES,
  NODENEXT_TYPES,
  STANDARD_TEST_INCLUDES,
  TEST_TYPES,
  TOOLS_CONFIG_FILES,
} from './tsconfig';

export {
  CONTRIBUTORS,
  REPOSITORY,
  HOMEPAGE,
  BUGS_URL,
  BASE_KEYWORDS,
  PLUGIN_KEYWORDS,
  ENGINES,
} from './package-json';
