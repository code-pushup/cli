import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import { getMeasureMarkNames } from '../../src/lib/performance-utils';
import {
  createTrackMark,
  objToPropertiesPayload,
} from '../../src/lib/user-timing-details-utils';

async function run() {
  performance.mark(getMeasureMarkNames('default-mark').startName, {
    detail: {
      devtools: createTrackMark({
        track: 'Main Track',
        // color:'primary' is default
        tooltipText: 'This is a default mark',
      }),
    },
  });
  await sleep(10);
  performance.mark(getMeasureMarkNames('primary-mark').startName, {
    detail: {
      devtools: createTrackMark({
        track: 'Main Track',
        color: 'secondary',
        tooltipText: 'This is a secondary mark',
      }),
    },
  });
  await sleep(10);
  performance.mark(getMeasureMarkNames('tertiary-mark').startName, {
    detail: {
      devtools: createTrackMark({
        track: 'Main Track',
        color: 'tertiary',
        properties: objToPropertiesPayload({
          'Property Info': 'This is a tertiary mark',
        }),
        tooltipText: 'This is a tertiary label',
      }),
    },
  });

  await sleep(10);
  performance.mark(getMeasureMarkNames('track2-mark').startName, {
    detail: {
      devtools: createTrackMark({
        track: 'Secondary Track',
      }),
    },
  });

  await sleep(10);
  performance.mark(getMeasureMarkNames('group-track-mark').startName, {
    detail: {
      devtools: createTrackMark({
        track: 'Secondary Track',
        trackGroup: 'Group Track2',
      }),
    },
  });

  getProfiler({
    enabled: true,
    fileBaseName: 'detail-devtools-mark',
    captureBuffered: true,
  });
}

run();
