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
      if (e.entryType !== 'mark' && e.entryType !== 'measure') continue;
      console.log('writing event', e.name, e.entryType);
      writeEvent(e as ProfilingEvent);

      // Clear the processed entries
      // if (e.entryType === 'mark') performance.clearMarks(e.name);
      //  if (e.entryType === 'measure') performance.clearMeasures(e.name);
    }
  };

  const flush = () => {
    const entries = [
      ...performance.getEntriesByType('mark'),
      ...performance.getEntriesByType('measure'),
    ];
    handleEntries(entries);
  };

  // initially flush all buffered entries
  if (captureBuffered) {
    flush();
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
