// 1. Generate output:
// npx tsx ./example/feat-capture-buffered.ts
// 2. Evaluate output:

/*
node -e "
const { validateTraceStructure } = require('../test-utils.js');
validateTraceStructure('buffered-performance-test', [
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"buffered-mark-start\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"buffered-mark-end\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"b\",\"name\":\"buffered-measure-1\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"span-async-measure:start\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"span-async-measure:end\"}
]);
"
*/
import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  performance.mark('buffered-mark-start');
  await sleep(100);
  performance.mark('buffered-mark-end');
  await sleep(100);
  const measure1 = performance.measure(
    'buffered-measure-1',
    'buffered-mark-start',
    'buffered-mark-end',
  );
  await sleep(100);
  const measure2 = performance.measure(
    'buffered-measure-2',
    'buffered-mark-start',
  );
  await sleep(100);
  const measure3 = performance.measure(
    'buffered-measure-file-upload-complete',
    {
      start: 'buffered-mark-start',
      end: 'buffered-mark-end',
    },
  );
  await sleep(100);

  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'buffered-performance-test',
    captureBuffered: true,
  });

  await sleep(100);

  await profiler.measureAsync('span-async-measure', async () => {
    await sleep(100);
  });
}

await runTest();
