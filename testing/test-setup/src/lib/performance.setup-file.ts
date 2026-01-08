import { vi } from 'vitest';
import { MockPerformanceObserver } from '@code-pushup/test-utils';

vi.mock('node:perf_hooks', () => ({
  performance: {
    getEntriesByType: vi.fn((type: string) => {
      const entries =
        MockPerformanceObserver.lastInstance()?.bufferedEntries || [];
      return entries.filter(entry => entry.entryType === type);
    }),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
  PerformanceObserver: MockPerformanceObserver,
}));
