import { PerformanceObserver, performance } from 'node:perf_hooks';
import { type ProfilingEvent } from './trace-file-output';

export interface PerformanceObserverOptions {
  processEvent: (event: ProfilingEvent) => void;
  captureBuffered?: boolean;
}

export interface PerformanceObserverHandle {
  flush: (clear?: boolean) => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

export function createPerformanceObserver(
  options: PerformanceObserverOptions,
): PerformanceObserverHandle {
  const { processEvent: writeEvent, captureBuffered = true } = options;

  const handleEntries = (
    entries: readonly PerformanceEntry[],
    clear = false,
  ) => {
    for (const e of entries) {
      if (e.entryType !== 'mark' && e.entryType !== 'measure') continue;
      console.log('writing event', e.name, e.entryType, e.toJSON());
      writeEvent(e as ProfilingEvent);

      if (clear) {
        if (e.entryType === 'mark') performance.clearMarks(e.name);
        if (e.entryType === 'measure') performance.clearMeasures(e.name);
      }
    }
  };

  const flush = (clear?: boolean) => {
    const entries = [
      ...performance.getEntriesByType('mark'),
      ...performance.getEntriesByType('measure'),
    ];
    handleEntries(entries, clear);
  };

  // initially flush all buffered entries and clear them
  if (captureBuffered) {
    flush(true);
  }

  let observer: PerformanceObserver | undefined = new PerformanceObserver(
    list => handleEntries(list.getEntries()),
  );

  observer.observe({
    entryTypes: ['mark', 'measure'],
    buffered: captureBuffered,
  });

  return {
    flush,
    disconnect: () => {
      observer?.disconnect();
      observer = undefined;
    },
    isConnected: () => observer !== undefined,
  };
}
