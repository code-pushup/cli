import { NodejsProfiler } from '../../src/lib/profiler/profiler-node.js';
import type { NodejsProfilerOptions } from '../../src/lib/profiler/profiler-node.js';
import { entryToTraceEvents } from '../../src/lib/profiler/trace-file-utils.js';
import type { TraceEvent } from '../../src/lib/profiler/trace-file.type.js';
import { traceEventWalFormat } from '../../src/lib/profiler/wal-json-trace.js';
import {
  asOptions,
  markerPayload,
  trackEntryPayload,
} from '../../src/lib/user-timing-extensibility-api-utils.js';
import type {
  ActionTrackEntryPayload,
  TrackMeta,
} from '../../src/lib/user-timing-extensibility-api.type.js';

export function getTrackConfig(): TrackMeta {
  return {
    track: `Track: ${process.pid}`,
    trackGroup: 'Multiprocess',
  };
}

/**
 * Default profiler configuration for multiprocess profiling mocks
 */
export function getProfilerConfig(
  options?: Partial<
    NodejsProfilerOptions<TraceEvent, Record<string, ActionTrackEntryPayload>>
  >,
): NodejsProfilerOptions<TraceEvent, Record<string, ActionTrackEntryPayload>> {
  return {
    format: {
      ...traceEventWalFormat(),
      encodePerfEntry: entryToTraceEvents,
    },
    ...getTrackConfig(),
    ...options,
  };
}

/**
 * Creates buffered performance marks and measures before profiler initialization
 */
export async function createBufferedEvents(): Promise<void> {
  const bM1 = `buffered-mark-${process.pid}`;
  performance.mark(bM1, asOptions(markerPayload({ color: 'tertiary' })));
  const intervalDelay = Math.floor(Math.random() * 150) + 50;
  await new Promise(resolve => setTimeout(resolve, intervalDelay));
  performance.measure(`buffered-${process.pid}`, {
    start: bM1,
    ...asOptions(
      trackEntryPayload({
        ...getTrackConfig(),
        color: 'tertiary',
      }),
    ),
  });
}

/**
 * Performs dummy work with random intervals and work packages
 */
export async function performDummyWork(
  profiler: NodejsProfiler<TraceEvent>,
): Promise<void> {
  profiler.marker(`process-${process.pid}:process-start`, {
    tooltipText: `Process ${process.pid} started`,
  });

  // Random number of intervals (2-5)
  const numIntervals = Math.floor(Math.random() * 4) + 2;

  for (let interval = 0; interval < numIntervals; interval++) {
    // Random interval delay (50-200ms)
    const intervalDelay = Math.floor(Math.random() * 150) + 50;
    await new Promise(resolve => setTimeout(resolve, intervalDelay));

    // Random number of work packages per interval (1-5)
    const numWorkPackages = Math.floor(Math.random() * 5) + 1;

    for (let pkg = 0; pkg < numWorkPackages; pkg++) {
      // Random work size (100-5000 elements)
      const workSize = Math.floor(Math.random() * 5_000_000);

      profiler.measure(
        `process-${process.pid}:interval-${interval}:work-${pkg}`,
        () => {
          const arr = Array.from({ length: workSize }, (_, i) => i);
          return arr.reduce((sum, x) => sum + x * Math.random(), 0);
        },
      );
    }
  }

  profiler.marker(`process-${process.pid}:process-end`, {
    tooltipText: `Process ${process.pid} completed ${numIntervals} intervals`,
  });
}
