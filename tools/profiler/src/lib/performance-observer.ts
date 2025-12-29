import { PerformanceObserver, performance } from 'node:perf_hooks';
import { type ProfilingEvent } from './trace-file-output';

export interface PerformanceObserverOptions {
  writeEvent: (event: ProfilingEvent) => void;
  captureBuffered?: boolean;
}

export interface PerformanceObserverHandle {
  flush: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

export function createPerformanceObserver(
  options: PerformanceObserverOptions,
): PerformanceObserverHandle {
  const { writeEvent, captureBuffered = true } = options;

  const handleEntries = (entries: readonly PerformanceEntry[]) => {
    for (const e of entries) {
      // we only observe mark/measure anyway, but keep the guard
      if (e.entryType !== 'mark' && e.entryType !== 'measure') continue;

      writeEvent(e as ProfilingEvent);

      // Clear *only* the processed measure by name (avoid global clears)
      if (e.entryType === 'measure') performance.clearMeasures(e.name);
    }
  };

  let observer: PerformanceObserver | undefined = new PerformanceObserver(
    list => handleEntries(list.getEntries()),
  );

  observer.observe({
    entryTypes: ['mark', 'measure'],
    buffered: captureBuffered,
  });

  return {
    flush: () => {
      if (!observer) return;
      // defensive: drain anything still sitting in the timeline
      handleEntries([
        ...performance.getEntriesByType('mark'),
        ...performance.getEntriesByType('measure'),
      ]);
    },
    disconnect: () => {
      observer?.disconnect();
      observer = undefined;
    },
    isConnected: () => observer !== undefined,
  };
}
