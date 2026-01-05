import process from 'node:process';
import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'buffered-performance-test',
  });

  // Video processing span
  await profiler.measureAsync('video-transcoding-job', async () => {
    // simulate some async work
    await sleep(100);
  });
}

await runTest();

// Ensure final events are captured before cleanup
const profiler = getProfiler();
profiler.close();
process.exit();
