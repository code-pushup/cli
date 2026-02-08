/**
 * JSDOM Polyfill Setup
 *
 * WHY THIS EXISTS:
 * axe-core has side effects on import - it expects global `window` and `document` objects
 * to be available when the module is loaded. In Node.js environments, these don't exist
 * by default. This polyfill creates a virtual DOM using JSDOM and sets these globals
 * before axe-core is imported.
 *
 * HOW IT WORKS:
 * - Creates a minimal JSDOM instance with a basic HTML document
 * - Sets globalThis.window and globalThis.document to the JSDOM window/document
 * - This must be imported BEFORE any axe-core imports to ensure globals exist
 *
 * IMPORT CHAIN:
 * This file is imported first by axe-core-polyfilled.ts, which then safely imports
 * axe-core. All other files should import from safe-axe-core-import.ts, not directly
 * from this file or from 'axe-core'.
 *
 * @see https://github.com/dequelabs/axe-core/issues/3962
 */
// @ts-expect-error - jsdom types are in devDependencies at root level
import { JSDOM } from 'jsdom';

const html = `<!DOCTYPE html>\n<html></html>`;
const { window: jsdomWindow } = new JSDOM(html);

// Set globals for axe-core compatibility
// eslint-disable-next-line  functional/immutable-data
globalThis.window = jsdomWindow as unknown as Window & typeof globalThis;
// eslint-disable-next-line  functional/immutable-data
globalThis.document = jsdomWindow.document;
