import type { EntryType, PerformanceEntry } from 'node:perf_hooks';
import { vi } from 'vitest';
import { MockPerformanceObserver } from './performance-observer.mock';

let nowMs = 0;
let entries: PerformanceEntry[] = [];

const clearEntries = (entryType: EntryType, name?: string) => {
  entries = entries.filter(
    e => e.entryType !== entryType || (name !== undefined && e.name !== name),
  );
  MockPerformanceObserver.globalEntries = entries;
};

const triggerObservers = (newEntries: PerformanceEntry[]) => {
  for (const observer of MockPerformanceObserver.instances) {
    if (!(observer as any).observing) continue;

    const mockEntryList = {
      getEntries: () => newEntries,
      getEntriesByType: (type: string) =>
        newEntries.filter(entry => entry.entryType === type),
      getEntriesByName: (name: string) =>
        newEntries.filter(entry => entry.name === name),
    };

    observer.callback(mockEntryList, observer);
  }
};

export const createPerformanceMock = (timeOrigin = 500_000) => ({
  timeOrigin,

  now: vi.fn(() => nowMs),

  mark: vi.fn((name: string, options?: { detail?: unknown }) => {
    entries.push({
      name,
      entryType: 'mark',
      startTime: nowMs,
      duration: 0,
      ...(options?.detail ? { detail: options.detail } : {}),
    } as PerformanceEntry);
    MockPerformanceObserver.globalEntries = entries;
  }),

  measure: vi.fn(
    (
      name: string,
      options?: { start?: string; end?: string; detail?: unknown },
    ) => {
      const entry = {
        name,
        entryType: 'measure',
        startTime: nowMs,
        duration: nowMs,
        ...(options?.detail ? { detail: options.detail } : {}),
      } as PerformanceEntry;
      entries.push(entry);
      MockPerformanceObserver.globalEntries = entries;
      triggerObservers([entry]);
    },
  ),

  getEntries: vi.fn(() => entries.slice()),

  getEntriesByType: vi.fn((type: string) =>
    entries.filter(e => e.entryType === type),
  ),

  getEntriesByName: vi.fn((name: string, type?: string) =>
    entries.filter(
      e => e.name === name && (type === undefined || e.entryType === type),
    ),
  ),

  clearMarks: vi.fn((name?: string) => clearEntries('mark', name)),

  clearMeasures: vi.fn((name?: string) => clearEntries('measure', name)),
});
