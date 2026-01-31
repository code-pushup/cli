import { NodejsProfiler } from '../../src/lib/profiler/profiler-node.js';
import { entryToTraceEvents } from '../../src/lib/profiler/trace-file-utils.js';
import { traceEventWalFormat } from '../../src/lib/profiler/wal-json-trace.js';

(async () => {
  const profiler = new NodejsProfiler({
    format: {
      ...traceEventWalFormat(),
      encodePerfEntry: entryToTraceEvents,
    },
  });

  profiler.marker(`process-${processId}:process-start`, {
    tooltipText: `Process ${processId} started`,
  });

  profiler.measure(`process-${processId}:work`, () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    return arr.reduce((sum, x) => sum + x, 0);
  });

  profiler.close();
})();
