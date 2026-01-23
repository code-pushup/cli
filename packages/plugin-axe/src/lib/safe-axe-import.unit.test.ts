import { describe, expect, it } from 'vitest';
import { withDom } from './safe-axe-import.js';

describe('withDom', () => {
  it('should set up DOM globals during function execution', async () => {
    const originalWindow = (globalThis as any).window;
    const originalDocument = (globalThis as any).document;
    const originalNode = (globalThis as any).Node;

    let capturedGlobals: any = {};

    await withDom(
      '<html><body><div id="test">Hello</div></body></html>',
      async () => {
        capturedGlobals = {
          window: (globalThis as any).window,
          document: (globalThis as any).document,
          Node: (globalThis as any).Node,
        };

        // Verify DOM globals are set
        expect(capturedGlobals.window).toBeDefined();
        expect(capturedGlobals.document).toBeDefined();
        expect(capturedGlobals.Node).toBeDefined();

        // Verify we can access DOM elements
        const testElement = capturedGlobals.document.getElementById('test');
        expect(testElement).toBeDefined();
        expect(testElement?.textContent).toBe('Hello');

        return 'success';
      },
    );

    // Verify globals are restored
    expect((globalThis as any).window).toBe(originalWindow);
    expect((globalThis as any).document).toBe(originalDocument);
    expect((globalThis as any).Node).toBe(originalNode);
  });

  it('should restore globals even if function throws', async () => {
    const originalWindow = (globalThis as any).window;
    const originalDocument = (globalThis as any).document;

    let globalsWereSet = false;

    await expect(
      withDom('<html><body></body></html>', async () => {
        globalsWereSet = (globalThis as any).window !== originalWindow;
        throw new Error('Test error');
      }),
    ).rejects.toThrow('Test error');

    // Verify globals were set during execution
    expect(globalsWereSet).toBe(true);

    // Verify globals are restored after error
    expect((globalThis as any).window).toBe(originalWindow);
    expect((globalThis as any).document).toBe(originalDocument);
  });

  it('should return the function result', async () => {
    const result = await withDom('<html><body></body></html>', async () => {
      return { success: true, value: 42 };
    });

    expect(result).toEqual({ success: true, value: 42 });
  });
});
