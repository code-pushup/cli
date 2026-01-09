import { vi } from 'vitest';

type EntryLike = Pick<
  PerformanceEntry,
  'name' | 'entryType' | 'startTime' | 'duration'
>;

export class MockPerformanceObserver {
  static instances: MockPerformanceObserver[] = [];
  static globalEntries: PerformanceEntry[] = [];

  static lastInstance(): MockPerformanceObserver | undefined {
    return this.instances.at(-1);
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

  takeRecords(): PerformanceEntryList {
    const entries = MockPerformanceObserver.globalEntries;
    MockPerformanceObserver.globalEntries = [];
    return entries as unknown as PerformanceEntryList;
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
        entryType: 'navigation',
        startTime,
        duration,
      },
    ]);
  }
}
