import { afterEach, beforeEach, vi } from 'vitest';
import { MockPerformanceObserver } from '@code-pushup/test-utils';
import { createPerformanceMock } from '../../../test-utils/src/lib/utils/perf-hooks.mock';

const MOCK_TIME_ORIGIN = 500_000;

vi.mock('node:perf_hooks', () => ({
  performance: createPerformanceMock(MOCK_TIME_ORIGIN),
  PerformanceObserver: MockPerformanceObserver,
}));

beforeEach(() => {
  MockPerformanceObserver.globalEntries = [];
  MockPerformanceObserver.instances = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});
