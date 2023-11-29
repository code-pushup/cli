import { SpyInstance, afterEach, beforeEach, vi } from 'vitest';

let consoleLogSpy: SpyInstance;

beforeEach(() => {
  consoleLogSpy = vi.spyOn(console, 'log');
});

afterEach(() => {
  consoleLogSpy.mockRestore();
});
