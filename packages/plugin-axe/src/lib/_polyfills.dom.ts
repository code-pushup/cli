// Polyfills for axe-core DOM access in Node.js environment
// This must be imported before any axe-core imports

/* eslint-disable functional/immutable-data, @typescript-eslint/no-explicit-any, unicorn/prefer-global-this, n/no-unsupported-features/node-builtins, unicorn/no-typeof-undefined, @typescript-eslint/no-empty-function */
if (typeof global.window === 'undefined') {
  const mockElement = {
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    textContent: '',
    innerHTML: '',
    className: '',
    id: '',
    tagName: 'DIV',
    parentNode: null,
    childNodes: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    ownerDocument: null,
  };

  // Mock document
  const mockDocument = {
    createElement: (tagName: string) => ({
      ...mockElement,
      tagName: tagName.toUpperCase(),
    }),
    createElementNS: (_ns: string, tagName: string) => ({
      ...mockElement,
      tagName: tagName.toUpperCase(),
    }),
    createTextNode: (text: string) => ({ ...mockElement, textContent: text }),
    body: { ...mockElement, tagName: 'BODY' },
    documentElement: { ...mockElement, tagName: 'HTML' },
    head: { ...mockElement, tagName: 'HEAD' },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByTagName: () => [mockElement],
    getElementsByClassName: () => [],
    createDocumentFragment: () => ({}),
    createComment: () => ({}),
    implementation: {
      createHTMLDocument: () => mockDocument,
    },
  };

  // Set up global objects
  (global as any).window = global;
  (global as any).document = mockDocument;

  // Only set navigator if it doesn't exist or isn't read-only
  try {
    if (typeof global.navigator === 'undefined') {
      (global as any).navigator = {
        userAgent: 'Node.js',
        platform: 'Node.js',
        appVersion: 'Node.js',
      };
    }
  } catch {
    // navigator is read-only, skip setting it
  }

  // Also set on globalThis for consistency
  (globalThis as any).window = (global as any).window;
  (globalThis as any).document = (global as any).document;
  try {
    if (typeof globalThis.navigator === 'undefined') {
      (globalThis as any).navigator = (global as any).navigator;
    }
  } catch {
    // navigator is read-only, skip setting it
  }
}
