import type { UserConfig as ViteUserConfig } from 'vitest/config';
import {
  type E2ETestOptions,
  createVitestConfig,
} from './vitest-config-factory.js';

/**
 * Creates a standardized Vitest configuration for unit tests.
 *
 * @param projectKey - The project name (used for cache and coverage directory naming)
 * @returns Vitest configuration object
 *
 * @example
 * ```typescript
 * export default createUnitTestConfig('my-package');
 * ```
 */
export function createUnitTestConfig(projectKey: string): ViteUserConfig {
  return createVitestConfig(projectKey, 'unit');
}

/**
 * Creates a standardized Vitest configuration for integration tests.
 *
 * @param projectKey - The project name (used for cache and coverage directory naming)
 * @returns Vitest configuration object
 *
 * @example
 * ```typescript
 * export default createIntTestConfig('my-package');
 * ```
 */
export function createIntTestConfig(projectKey: string): ViteUserConfig {
  return createVitestConfig(projectKey, 'int');
}

/**
 * Creates a standardized Vitest configuration for E2E tests.
 *
 * @param projectKey - The project name (used for cache and coverage directory naming)
 * @param options - Optional configuration for E2E tests
 * @returns Vitest configuration object
 *
 * @example
 * ```typescript
 * // Basic usage
 * export default createE2ETestConfig('my-e2e');
 *
 * // With options
 * export default createE2ETestConfig('my-e2e', {
 *   testTimeout: 60_000,
 * });
 */
export function createE2ETestConfig(
  projectKey: string,
  options?: E2ETestOptions,
): ViteUserConfig {
  return createVitestConfig(projectKey, 'e2e', options);
}
