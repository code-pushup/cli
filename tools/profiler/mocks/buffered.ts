import process from 'node:process';
import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

async function runTest() {
  // Create marks for measurement
  performance.mark('mark-start');
  await sleep(100);
  performance.mark('mark-end');
  await sleep(100);
  // Test measure with string overloads
  const measure1 = performance.measure('measure-1', 'mark-start', 'mark-end');
  await sleep(100);
  const measure2 = performance.measure('measure-2', 'mark-start');
  await sleep(100);
  // File upload measurement
  const measure3 = performance.measure('measure-file-upload-complete', {
    start: 'mark-start',
    end: 'mark-end',
    detail: {
      fileUpload: {
        filename: 'user-avatar.jpg',
        size: '2.4 MB',
        uploadSpeed: '1.8 MB/s',
        chunks: 12,
        retries: 0,
      },
    },
  });
  await sleep(100);

  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'buffered-performance-test',
  });

  await sleep(100);

  // Video processing span
  await profiler.spanAsync(
    'video-transcoding-job',
    async () => {
      // simulate some async work
      await sleep(100);
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Media Processing',
          trackGroup: 'Content Pipeline',
          color: 'secondary-dark',
          properties: [
            ['Input Format', 'MP4 (H.264)'],
            ['Output Format', 'WebM (VP9)'],
            ['Input Resolution', '1920x1080 (1080p)'],
            ['Output Resolution', '1280x720 (720p)'],
            ['Input Duration', '15m 32s'],
            ['Processing Speed', '2.1x realtime'],
            ['Compression Ratio', '68%'],
            ['Bitrate Reduction', '45%'],
            ['Quality Score', '87/100'],
            ['GPU Acceleration', 'Enabled (NVIDIA RTX 3080)'],
            ['Queue Position', '3/12 jobs'],
          ],
          tooltipText:
            'Video transcoding pipeline - converting user upload to web-optimized format',
        },
      },
    },
  );
}

await runTest();

// Ensure final events are captured before cleanup
const profiler = getProfiler();
