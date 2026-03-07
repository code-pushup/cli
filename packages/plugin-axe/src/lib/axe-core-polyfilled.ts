/**
 * Axe-core Polyfilled Import
 *
 * This file ensures the jsdom polyfill runs BEFORE axe-core is imported.
 * Static imports are evaluated in order, so the polyfill import must come first.
 *
 * WHY THIS EXISTS:
 * axe-core has side effects on import - it expects global `window` and `document` objects
 * to be available when the module is loaded. In Node.js environments, these don't exist
 * by default. This polyfill creates a virtual DOM using JSDOM and sets these globals
 * before axe-core is imported.
 *
 * IMPORT ORDER IS CRITICAL:
 * 1. jsdom.polyfill.ts is imported first (sets up globalThis.window and globalThis.document)
 * 2. axe-core is imported second (now globals exist)
 *
 * IMPORT CHAIN:
 * 1. This file (imports polyfill, then imports axe-core)
 * 2. safe-axe-core-import.ts (re-exports for clean imports)
 *
 * USAGE:
 * Do NOT import from this file directly. Use safe-axe-core-import.ts instead.
 *
 * @see https://github.com/dequelabs/axe-core/issues/3962
 */
// CRITICAL: This import MUST come before axe-core import
// It sets up globalThis.window and globalThis.document as side effects
// eslint-disable-next-line import/no-unassigned-import
// Now safe to import axe-core - globals exist due to polyfill above
// This import MUST come after the polyfill import
import axe from 'axe-core';
import './jsdom.polyfill.js';

// Re-export axe as default
export default axe;

// Re-export all types used throughout the codebase
export type {
  AxeResults,
  NodeResult,
  Result,
  IncompleteResult,
  RuleMetadata,
  ImpactValue,
  CrossTreeSelector,
} from 'axe-core';
