import { afterEach, beforeEach, vi } from 'vitest';
import {
  MockPerformanceObserver,
  createPerformanceMock,
} from '@code-pushup/test-utils';

const MOCK_TIME_ORIGIN = 1_700_000_000_000; // Realistic + readeable time origin: 2023-11-14 22:13:20.000

vi.mock('node:perf_hooks', () => ({
  performance: createPerformanceMock(MOCK_TIME_ORIGIN),
  PerformanceObserver: MockPerformanceObserver,
}));

beforeEach(() => {
  MockPerformanceObserver.reset();
  vi.stubGlobal('performance', createPerformanceMock(MOCK_TIME_ORIGIN));
});

afterEach(() => {
  vi.unstubAllGlobals();
});
