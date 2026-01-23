// Polyfills for axe-core DOM access in Node.js environment
// This must be imported before any axe-core imports

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
    createElement: tagName => ({
      ...mockElement,
      tagName: tagName.toUpperCase(),
    }),
    createElementNS: (ns, tagName) => ({
      ...mockElement,
      tagName: tagName.toUpperCase(),
    }),
    createTextNode: text => ({ ...mockElement, textContent: text }),
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
  global.window = global;
  global.document = mockDocument;

  // Only set navigator if it doesn't exist or isn't read-only
  try {
    if (typeof global.navigator === 'undefined') {
      global.navigator = {
        userAgent: 'Node.js',
        platform: 'Node.js',
        appVersion: 'Node.js',
      };
    }
  } catch (e) {
    // navigator is read-only, skip setting it
  }

  // Also set on globalThis for consistency
  globalThis.window = global.window;
  globalThis.document = global.document;
  try {
    if (typeof globalThis.navigator === 'undefined') {
      globalThis.navigator = global.navigator;
    }
  } catch (e) {
    // navigator is read-only, skip setting it
  }
}
