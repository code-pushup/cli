// ============================================================================
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
export const NODE_TYPES = ['node'];

/** Vitest types for globals and importMeta */
export const VITEST_TYPES = ['vitest/globals', 'vitest/importMeta'];

/** Additional Vitest type */
export const VITEST_TYPE = 'vitest';

/** Vite client types */
export const VITE_CLIENT_TYPES = ['vite/client'];

/** NodeNext types for tools */
export const NODENEXT_TYPES = ['nodenext'];

/** Base Vitest types (for base configs) */
export const BASE_VITEST_TYPES = ['vitest'];

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
