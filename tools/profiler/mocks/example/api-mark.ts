// 1. Generate output:
// npx tsx ./example/api-mark.ts
// 2. Evaluate output:

/*
node -e "
const { validateTraceStructure } = require('../test-utils.js');
validateTraceStructure('api-mark', [
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark-details-raw\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark-details\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark-details-error:start\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark-details-error\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark-details-devtools\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"mark-details-devtools-error\"}
]);
"
*/
import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';
import {
  asOptions,
  markerErrorPayload,
  markerPayload,
  objToPropertiesPayload,
  trackEntryErrorPayload,
  trackEntryPayload,
} from '../../src/lib/user-timing-details-utils.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-mark',
  });

  profiler.mark('mark');
  await sleep(10);

  profiler.mark('mark-details-raw', {
    properties: [
      ['str', 'This is a detail property'],
      ['num', 42],
      ['object', { str: '42', num: 42 }],
      ['array', [42, 42, 42]],
    ],
    tooltipText: 'This is a tooltip text for the mark',
  });
  await sleep(10);

  profiler.mark('mark-details', {
    color: 'tertiary',
    properties: objToPropertiesPayload({
      str: 'This is a detail property',
      num: 42,
      object: { str: '42', num: 42 },
      array: [42, 42, 42],
    }),
  });
  await sleep(10);

  profiler.mark('mark-details-error', {
    properties: objToPropertiesPayload({
      ['Error Type']: 'ValidationError',
    }),
  });

  await sleep(10);

  const trackMetaPayload = {
    track: 'Program',
    trackGroup: 'Main Process',
  };
  profiler.mark('mark-details-devtools', {
    ...trackMetaPayload,
    properties: objToPropertiesPayload({
      ['str']: 'This is a detail.devtools property',
      ['num']: 42,
      ['object']: { str: '42', num: 42 },
      ['array']: [42, 42, 42],
    }),
    tooltipText: 'This is a tooltip text for the mark',
  });

  await sleep(10);

  profiler.mark('mark-details-devtools-error', {
    ...trackMetaPayload,
    properties: objToPropertiesPayload({
      ['Error Type']: 'ValidationError',
      ['Error Message']: 'Invalid input data provided',
    }),
    tooltipText: 'ValidationError: Invalid input data provided',
  });
}

runTest();
