import type { PerformanceEntry } from 'node:perf_hooks';
import { vi } from 'vitest';

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

    // If buffered is true, trigger observer callback with all existing entries
    if (this.buffered && MockPerformanceObserver.globalEntries.length > 0) {
      this.triggerObserverCallback();
    }
  });

  disconnect = vi.fn(() => {
    this.observing = false;
    const index = MockPerformanceObserver.instances.indexOf(this);
    if (index > -1) {
      MockPerformanceObserver.instances.splice(index, 1);
    }
  });

  /** Test helper: trigger observer callback with current global entries */
  triggerObserverCallback() {
    if (!this.observing) return;

    const perfEntries = MockPerformanceObserver.globalEntries;

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
}
