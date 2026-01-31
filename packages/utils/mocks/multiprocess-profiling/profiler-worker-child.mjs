import { NodejsProfiler } from '../../src/lib/profiler/profiler-node.js';
import { entryToTraceEvents } from '../../src/lib/profiler/trace-file-utils.js';
import { traceEventWalFormat } from '../../src/lib/profiler/wal-json-trace.js';

(async () => {
  const profiler = new NodejsProfiler({
    format: {
      ...traceEventWalFormat(),
      encodePerfEntry: entryToTraceEvents,
    },
    track: `Track: ${process.pid}`,
    trackGroup: 'Multiprocess',
    enabled: true, // Explicitly enable profiler
  });

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
      const workSize = Math.floor(Math.random() * 5000000);

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

  profiler.close();
})();
