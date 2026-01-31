import { NodejsProfiler } from '../src/lib/profiler/profiler-node.js';
import { entryToTraceEvents } from '../src/lib/profiler/trace-file-utils.js';
import { traceEventWalFormat } from '../src/lib/profiler/wal-json-trace.js';

(async () => {
  const profiler = new NodejsProfiler({
    format: {
      ...traceEventWalFormat(),
      encodePerfEntry: entryToTraceEvents,
    },
  });

  // Create some measures
  profiler.marker(`process-${process.pid}-start`, {
    tooltipText: `Process ${process.pid} started`,
  });

  profiler.measure(`process-${process.pid}-work`, () => {
    // Simulate work
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    return arr.reduce((sum, x) => sum + x, 0);
  });

  profiler.marker(`process-${process.pid}-end`, {
    tooltipText: `Process ${process.pid} finished`,
  });

  profiler.close();
})();
