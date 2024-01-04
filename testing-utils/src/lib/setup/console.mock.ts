import { SpyInstance, afterEach, beforeEach, vi } from 'vitest';

let consoleInfoSpy: SpyInstance | undefined;
let consoleWarnSpy: SpyInstance | undefined;
let consoleErrorSpy: SpyInstance | undefined;

beforeEach(() => {
  // In multi-progress-bars, console methods are overriden
  if (console.info != null) {
    consoleInfoSpy = vi.spyOn(console, 'info');
  }

  if (console.warn != null) {
    consoleWarnSpy = vi.spyOn(console, 'warn');
  }

  if (console.error != null) {
    consoleErrorSpy = vi.spyOn(console, 'error');
  }
});

afterEach(() => {
  consoleInfoSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
});
