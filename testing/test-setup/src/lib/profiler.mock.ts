import { vi } from 'vitest';

// Mock the profiler from utils to be disabled by default in tests
vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    profiler: {
      measure: vi.fn(async (name: string, fn: Function, options?: any) => {
        return await fn();
      }),
      measureAsync: vi.fn(async (name: string, fn: Function, options?: any) => {
        return await fn();
      }),
      marker: vi.fn(),
      mark: vi.fn(),
      isEnabled: vi.fn(() => false),
      enableProfiling: vi.fn(),
      getFilePathForExt: vi.fn(() => ''),
      flush: vi.fn(),
      close: vi.fn(),
    },
  };
});
