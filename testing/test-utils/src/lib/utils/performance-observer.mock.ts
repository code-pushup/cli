import type { EntryType, PerformanceEntry } from 'node:perf_hooks';
import { vi } from 'vitest';

type EntryLike = Pick<
  PerformanceEntry,
  'name' | 'entryType' | 'startTime' | 'duration'
>;

interface PerformanceObserverInit {
  entryTypes?: EntryType[];
  type?: EntryType;
  buffered?: boolean;
}

interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[];
  getEntriesByType(type: string): PerformanceEntry[];
  getEntriesByName(name: string): PerformanceEntry[];
}

type PerformanceObserverCallback = (
  list: PerformanceObserverEntryList,
  observer: MockPerformanceObserver,
) => void;

export class MockPerformanceObserver {
  static instances: MockPerformanceObserver[] = [];
  static globalEntries: PerformanceEntry[] = [];

  static lastInstance(): MockPerformanceObserver | undefined {
    return this.instances.at(-1);
  }

  static reset() {
    this.globalEntries = [];
    this.instances = [];
  }

  buffered = false;
  private observing = false;
  callback: PerformanceObserverCallback;

  constructor(cb: PerformanceObserverCallback) {
    this.callback = cb;
    MockPerformanceObserver.instances.push(this);
  }

  observe = vi.fn((options: PerformanceObserverInit) => {
    this.observing = true;
    this.buffered = options.buffered ?? false;

    // If buffered is true, emit all existing entries immediately
    if (this.buffered && MockPerformanceObserver.globalEntries.length > 0) {
      this.emit(MockPerformanceObserver.globalEntries.slice());
    }
  });

  disconnect = vi.fn(() => {
    this.observing = false;
    const index = MockPerformanceObserver.instances.indexOf(this);
    if (index > -1) {
      MockPerformanceObserver.instances.splice(index, 1);
    }
  });

  /** Test helper: simulate delivery of performance entries */
  emit(entries: EntryLike[]) {
    if (!this.observing) return;

    const perfEntries = entries as unknown as PerformanceEntry[];
    MockPerformanceObserver.globalEntries.push(...perfEntries);

    // Create a mock PerformanceObserverEntryList
    const mockEntryList = {
      getEntries: () => perfEntries,
      getEntriesByType: (type: string) =>
        perfEntries.filter(entry => entry.entryType === type),
      getEntriesByName: (name: string) =>
        perfEntries.filter(entry => entry.name === name),
    };

    this.callback(mockEntryList, this);
  }

  takeRecords(): PerformanceObserverEntryList {
    const entries = MockPerformanceObserver.globalEntries;
    MockPerformanceObserver.globalEntries = [];
    return entries as unknown as PerformanceObserverEntryList;
  }

  emitMark(name: string) {
    this.emit([
      {
        name,
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);
  }

  emitNavigation(
    name: string,
    {
      startTime = 0,
      duration = 0,
    }: { startTime?: number; duration?: number } = {},
  ) {
    this.emit([
      {
        name,
        entryType: 'navigation' as any,
        startTime,
        duration,
      },
    ]);
  }
}
