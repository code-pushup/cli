import { MockInstance, afterEach, beforeEach, vi } from 'vitest';

let consoleInfoSpy: MockInstance | undefined;
let consoleWarnSpy: MockInstance | undefined;
let consoleErrorSpy: MockInstance | undefined;

beforeEach(() => {
  // In multi-progress-bars, console methods are overriden
  if (console.info != null) {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  }

  if (console.warn != null) {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  }

  if (console.error != null) {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterEach(() => {
  consoleInfoSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
});
