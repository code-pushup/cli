import { PerformanceObserver, performance } from 'node:perf_hooks';
import { type ProfilingEvent } from './output-format';

export interface PerformanceObserverOptions {
  /** Callback to write performance events */
  writeEvent: (event: ProfilingEvent) => void;
  /** Whether to capture buffered events immediately */
  captureBuffered?: boolean;
}

export interface PerformanceObserverHandle {
  /** Manually flush pending performance entries */
  flush: () => void;
  /** Disconnect the observer */
  disconnect: () => void;
  /** Check if observer is connected */
  isConnected: () => boolean;
}

/**
 * Creates and manages a PerformanceObserver for profiling.
 * Returns a handle with methods to control the observer lifecycle.
 */
export function createPerformanceObserver(
  options: PerformanceObserverOptions,
): PerformanceObserverHandle {
  const { writeEvent, captureBuffered = true } = options;
  let observer: PerformanceObserver | undefined;

  const processEntries = (entries: PerformanceEntry[]): void => {
    for (const entry of entries) {
      if (entry.entryType === 'mark' || entry.entryType === 'measure') {
        writeEvent(entry as ProfilingEvent);

        // Clear measures after processing to prevent memory leaks
        if (entry.entryType === 'measure') {
          performance.clearMeasures(entry.name);
        }
        // Note: marks are kept for potential future measurements
      }
    }
  };

  const captureBufferedEvents = (): void => {
    const existingMarks = performance.getEntriesByType('mark');
    const existingMeasures = performance.getEntriesByType('measure');

    // Process existing events
    processEntries([...existingMarks, ...existingMeasures]);

    // Clear the captured entries
    performance.clearMarks();
    performance.clearMeasures();
  };

  const initialize = (): void => {
    if (observer) return;

    observer = new PerformanceObserver(list => {
      processEntries(list.getEntries());
    });

    // Start observing with buffered mode to never miss events
    observer.observe({
      entryTypes: ['mark', 'measure'],
      buffered: true,
    });

    // Capture any existing buffered events
    if (captureBuffered) {
      captureBufferedEvents();
    }
  };

  // Initialize immediately
  initialize();

  const flush = (): void => {
    if (!observer) return;

    // First, get any queued entries from the observer
    try {
      const queuedEntries = observer.takeRecords();
      processEntries(queuedEntries);
    } catch (error) {
      // takeRecords might not be available in all Node.js versions
      console.warn('Failed to take observer records:', error);
    }

    // Then, check for any entries that might exist in the timeline
    // but weren't queued to the observer yet (defensive programming)
    const allMarks = performance.getEntriesByType('mark');
    const allMeasures = performance.getEntriesByType('measure');
    processEntries([...allMarks, ...allMeasures]);
  };

  const disconnect = (): void => {
    if (observer) {
      observer.disconnect();
      observer = undefined;
    }
  };

  const isConnected = (): boolean => {
    return observer !== undefined;
  };

  return {
    flush,
    disconnect,
    isConnected,
  };
}
