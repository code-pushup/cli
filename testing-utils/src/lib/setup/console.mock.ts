import { SpyInstance, afterEach, beforeEach, vi } from 'vitest';

let consoleInfoSpy: SpyInstance;
let consoleWarnSpy: SpyInstance;
let consoleErrorSpy: SpyInstance;

beforeEach(() => {
  consoleInfoSpy = vi.spyOn(console, 'info');
  consoleWarnSpy = vi.spyOn(console, 'warn');
  consoleErrorSpy = vi.spyOn(console, 'error');
});

afterEach(() => {
  consoleInfoSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});
