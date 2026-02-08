/**
 * Axe-core Polyfilled Import
 *
 * This file ensures the jsdom polyfill runs BEFORE axe-core is imported.
 * Uses dynamic import to avoid ES module hoisting issues.
 *
 * WHY THIS EXISTS:
 * axe-core has side effects on import - it expects global `window` and `document` objects
 * to be available when the module is loaded. In Node.js environments, these don't exist
 * by default. This polyfill creates a virtual DOM using JSDOM and sets these globals
 * before axe-core is imported.
 *
 * HOW IT WORKS:
 * 1. Top-level code sets up JSDOM polyfill (runs immediately)
 * 2. Axe-core is imported dynamically (runs after polyfill)
 * 3. Module exports a promise that resolves to axe-core
 *
 * IMPORT CHAIN:
 * 1. This file (sets up polyfill, then dynamically imports axe-core)
 * 2. safe-axe-core-import.ts (re-exports for clean imports)
 *
 * USAGE:
 * Do NOT import from this file directly. Use safe-axe-core-import.ts instead.
 *
 * @see https://github.com/dequelabs/axe-core/issues/3962
 */
import { JSDOM } from 'jsdom';

// Polyfill setup - runs immediately before any axe-core code
const html = `<!DOCTYPE html>\n<html></html>`;
const { window: jsdomWindow } = new JSDOM(html);

// Set globals for axe-core compatibility
// eslint-disable-next-line functional/immutable-data
globalThis.window = jsdomWindow as unknown as Window & typeof globalThis;
// eslint-disable-next-line functional/immutable-data
globalThis.document = jsdomWindow.document;

// Dynamic import ensures polyfill runs first
// This cannot be a top-level await, so we export the promise
const axePromise = import('axe-core');

// Re-export types (these are compile-time only, no runtime impact)
export type {
  AxeResults,
  NodeResult,
  Result,
  IncompleteResult,
  RuleMetadata,
  ImpactValue,
  CrossTreeSelector,
} from 'axe-core';

// Export the axe instance synchronously by awaiting at the top level
// Top-level await is supported in ES modules
export default (await axePromise).default;
