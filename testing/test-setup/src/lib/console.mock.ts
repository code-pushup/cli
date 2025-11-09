import { type MockInstance, afterEach, beforeEach, vi } from 'vitest';

// TODO: remove once logger is used everywhere

let consoleInfoSpy: MockInstance<any[], void> | undefined;
let consoleWarnSpy: MockInstance<any[], void> | undefined;
let consoleErrorSpy: MockInstance<any[], void> | undefined;

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
