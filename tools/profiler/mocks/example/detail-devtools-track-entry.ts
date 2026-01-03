import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import { trackEntryPayload } from '../../src/lib/user-timing-details-utils';
import type { MarkOpts } from '../../src/lib/user-timing-to-trace-event-utils';

async function run() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'detail-devtools-track-entry',
  });

  await profiler.spanAsync(
    'default-measure',
    async () => {
      await sleep(10);
    },
    {
      detail: {
        devtools: trackEntryPayload({
          track: 'Main Track',
          tooltipText: 'This is a secondary mark',
        }),
      },
    },
  );

  await sleep(10);

  await profiler.spanAsync(
    'track-group-measure',
    async () => {
      await sleep(10);
    },
    {
      detail: {
        devtools: trackEntryPayload({
          track: 'Worker Track',
          trackGroup: 'Secondary Program',
          color: 'secondary',
          tooltipText: 'This is a secondary mark',
        }),
      },
    },
  );
}

run();
