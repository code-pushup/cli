/**
 * Safe Axe-core Import Entry Point
 *
 * This is the ONLY safe way to import axe-core in this codebase.
 * All files should import from this module instead of importing directly from 'axe-core'.
 *
 * WHY THIS EXISTS:
 * axe-core requires global `window` and `document` objects to exist when imported.
 * Due to ES module import hoisting, we need a fixed import chain to ensure the
 * jsdom polyfill runs before axe-core loads.
 *
 * IMPORT CHAIN:
 * jsdom.polyfill.ts → axe-core-polyfilled.ts → safe-axe-core-import.ts → your code
 *
 * USAGE:
 * Instead of: import axe from 'axe-core';
 * Use:        import axe from './safe-axe-core-import.js';
 *
 * Instead of: import type { AxeResults } from 'axe-core';
 * Use:        import type { AxeResults } from './safe-axe-core-import.js';
 */

// Re-export everything from the polyfilled version
export { default } from './axe-core-polyfilled.js';
export type {
  AxeResults,
  NodeResult,
  Result,
  IncompleteResult,
  RuleMetadata,
  ImpactValue,
  CrossTreeSelector,
} from './axe-core-polyfilled.js';
