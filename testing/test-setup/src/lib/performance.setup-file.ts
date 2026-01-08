import type { PerformanceEntry } from 'node:perf_hooks';
import { type MockInstance, afterEach, beforeEach, vi } from 'vitest';
import { MockPerformanceObserver } from '@code-pushup/test-utils';

const MOCK_DATE_NOW_MS = 1_000_000;
const MOCK_TIME_ORIGIN = 500_000;

const dateNow = MOCK_DATE_NOW_MS;
const performanceTimeOrigin = MOCK_TIME_ORIGIN;

/* eslint-disable functional/no-let */
let dateNowSpy: MockInstance<[], number> | undefined;
/* eslint-enable functional/no-let */

const clearPerformanceEntries = (
  entryType: 'mark' | 'measure',
  name?: string,
) => {
  if (name) {
    const index = MockPerformanceObserver.globalEntries.findIndex(
      entry => entry.entryType === entryType && entry.name === name,
    );
    if (index > -1) MockPerformanceObserver.globalEntries.splice(index, 1);
  } else {
    MockPerformanceObserver.globalEntries =
      MockPerformanceObserver.globalEntries.filter(
        entry => entry.entryType !== entryType,
      );
  }
};

vi.mock('node:perf_hooks', () => ({
  performance: {
    getEntries: vi.fn(() => MockPerformanceObserver.globalEntries.slice()),
    getEntriesByType: vi.fn((type: string) =>
      MockPerformanceObserver.globalEntries.filter(
        entry => entry.entryType === type,
      ),
    ),
    getEntriesByName: vi.fn((name: string, type?: string) =>
      MockPerformanceObserver.globalEntries.filter(
        entry =>
          entry.name === name &&
          (type === undefined || entry.entryType === type),
      ),
    ),
    mark: vi.fn((name: string) => {
      const entry: PerformanceEntry = {
        name,
        entryType: 'mark',
        startTime: performance.now(),
        duration: 0,
      } as PerformanceEntry;
      MockPerformanceObserver.globalEntries.push(entry);
    }),
    measure: vi.fn((name: string, startMark?: string, endMark?: string) => {
      const startEntry = startMark
        ? MockPerformanceObserver.globalEntries.find(
            entry => entry.name === startMark && entry.entryType === 'mark',
          )
        : undefined;
      const endEntry = endMark
        ? MockPerformanceObserver.globalEntries.find(
            entry => entry.name === endMark && entry.entryType === 'mark',
          )
        : undefined;

      const startTime = startEntry ? startEntry.startTime : performance.now();
      const endTime = endEntry ? endEntry.startTime : performance.now();

      const entry: PerformanceEntry = {
        name,
        entryType: 'measure',
        startTime,
        duration: endTime - startTime,
      } as PerformanceEntry;
      MockPerformanceObserver.globalEntries.push(entry);
    }),
    clearMarks: vi.fn((name?: string) => clearPerformanceEntries('mark', name)),
    clearMeasures: vi.fn((name?: string) =>
      clearPerformanceEntries('measure', name),
    ),
    now: vi.fn(() => Date.now()),
  },
  PerformanceObserver: MockPerformanceObserver,
}));

beforeEach(() => {
  // Mock browser timing APIs
  dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(dateNow);

  // Mock global performance.timeOrigin for browser API
  vi.stubGlobal('performance', {
    timeOrigin: performanceTimeOrigin,
    now: vi.fn(() => dateNow - performanceTimeOrigin),
  });

  // Clear performance observer entries for clean test state
  MockPerformanceObserver.globalEntries = [];
});

afterEach(() => {
  vi.unstubAllGlobals();

  if (dateNowSpy) {
    dateNowSpy.mockRestore();
    dateNowSpy = undefined;
  }
});
