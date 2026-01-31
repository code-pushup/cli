/**
 * Axe-core Polyfilled Import
 *
 * This file ensures the jsdom polyfill runs BEFORE axe-core is imported.
 * Due to ES module import hoisting, we must import the polyfill explicitly
 * at the top of this file, then import axe-core. This guarantees the correct
 * execution order: polyfill setup → axe-core import.
 *
 * IMPORT CHAIN:
 * 1. jsdom.polyfill.ts (sets globalThis.window and globalThis.document)
 * 2. This file (imports polyfill, then imports axe-core)
 * 3. safe-axe-core-import.ts (re-exports for clean imports)
 *
 * USAGE:
 * Do NOT import from this file directly. Use safe-axe-core-import.ts instead.
 */
// Import polyfill FIRST to ensure globals are set before axe-core loads
// eslint-disable-next-line import/no-unassigned-import
// Now safe to import axe-core - globals exist due to polyfill import above
import axe from 'axe-core';
import './jsdom.polyfill.js';

// Re-export axe default and all types used throughout the codebase
export default axe;

export type {
  AxeResults,
  NodeResult,
  Result,
  IncompleteResult,
  RuleMetadata,
  ImpactValue,
  CrossTreeSelector,
} from 'axe-core';
