import { JSDOM } from 'jsdom';

/**
 * Executes a function with a temporary DOM environment set up.
 * Global state is automatically restored after execution.
 *
 * This is the recommended pattern for working with DOM-dependent libraries
 * in Node.js environments. It provides proper isolation and cleanup.
 *
 * @param html - HTML string to initialize the DOM with
 * @param fn - Function to execute with the DOM environment
 * @returns The result of the function execution
 */
export async function withDom<T>(
  html: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const { JSDOM } = await import('jsdom');

  // Save previous global state
  const previous = {
    window: (globalThis as any).window,
    document: (globalThis as any).document,
    Node: (globalThis as any).Node,
  };

  // Set up DOM environment
  const dom = new JSDOM(html);
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Node: dom.window.Node,
  });

  try {
    return await fn();
  } finally {
    // Restore previous global state
    Object.assign(globalThis, previous);
  }
}

/**
 * Safely imports axe-core by setting up the DOM environment first.
 *
 * This is the only correct pattern for importing axe-core in Node.js.
 * Always set up the DOM before importing axe-core, never after.
 *
 * @returns The axe-core module
 */
export async function importAxeCore(): Promise<any> {
  return withDom('<!doctype html><html><body></body></html>', async () => {
    const axe = await import('axe-core');
    return axe.default;
  });
}
