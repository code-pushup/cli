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

  constructor(cb: PerformanceObserverCallback) {
    MockPerformanceObserver.instances.push(this);
  }

  observe(options: PerformanceObserverInit) {
    this.observing = true;
    this.buffered = options.buffered ?? false;
  }

  disconnect() {
    this.observing = false;
    const index = MockPerformanceObserver.instances.indexOf(this);
    if (index > -1) {
      MockPerformanceObserver.instances.splice(index, 1);
    }
  }

  /** Test helper: simulate delivery of performance entries */
  emit(entries: EntryLike[]) {
    if (!this.observing) return;

    const perfEntries = entries as unknown as PerformanceEntry[];
    MockPerformanceObserver.globalEntries.push(...perfEntries);

    // For unit tests, don't call the callback automatically to avoid complex interactions
    // Just buffer the entries so takeRecords() can return them
  }

  emitMark(name: string, { startTime = 0 }: { startTime?: number } = {}) {
    this.emit([
      {
        name,
        entryType: 'mark',
        startTime,
        duration: 0,
      },
    ]);
  }
  emitMeasure(
    name: string,
    {
      startTime = 0,
      duration = 0,
    }: { startTime?: number; duration?: number } = {},
  ) {
    this.emit([
      {
        name,
        entryType: 'measure',
        startTime,
        duration,
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
