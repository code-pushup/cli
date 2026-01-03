import { setTimeout as sleep } from 'timers/promises';
import {
  asOptions,
  markerErrorPayload,
  objToPropertiesPayload,
  trackEntryErrorPayload,
  trackEntryPayload,
} from 'tools/profiler/src/lib/user-timing-details-utils.js';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-measure',
  });

  profiler.mark('measure-mark-start-to-now:start');
  await sleep(10);
  profiler.measure(
    'measure-mark-start-to-now',
    'measure-mark-start-to-now:start',
  );

  await sleep(10);

  profiler.mark('measure-overload-name-startMark-endMark:start');
  await sleep(10);
  profiler.mark('measure-overload-name-startMark-endMark:end');

  profiler.measure(
    'measure-overload-name-startMark-endMark',
    'measure-overload-name-startMark-endMark:start',
    'measure-overload-name-startMark-endMark:end',
  );

  await sleep(10);

  profiler.mark('measure-overload-options-start-end:start');
  await sleep(10);
  profiler.mark('measure-overload-options-start-end:end');
  profiler.measure('measure-overload-options-start-end', {
    start: 'measure-overload-options-start-end:start',
    end: 'measure-overload-options-start-end:end',
  });

  await sleep(10);

  profiler.measure('measure-overload-options-duration', {
    start: 'measure-overload-options-start-end:start',
    duration: 50,
  });

  await sleep(10);

  profiler.mark('measure-details-raw:start');
  await sleep(10);
  profiler.mark('measure-details-raw:end');

  profiler.measure('measure-details-raw', {
    start: 'measure-details-raw:start',
    end: 'measure-details-raw:end',
    detail: {
      str: 'This is a detail property',
      num: 42,
      obj: {
        num: 42,
      },
      array: [42, 42, 42],
    },
  });

  await sleep(10);
  const trackMetaPayload = {
    track: 'Program',
    trackGroup: 'Main Process',
  };

  profiler.mark('measure-details:start');
  await sleep(10);
  profiler.mark('measure-details:end');

  profiler.measure('measure-details', {
    start: 'measure-details:start',
    end: 'measure-details:end',
    ...asOptions(
      trackEntryPayload({
        ...trackMetaPayload,
        properties: objToPropertiesPayload({
          str: 'This is a detail property',
          num: 42,
          object: { str: '42', num: 42 },
          array: [42, 42, 42],
        }),
      }),
    ),
  });

  await sleep(10);

  profiler.mark('measure-details-error:start');
  await sleep(10);
  profiler.mark(
    'measure-details-error:end',
    asOptions(
      markerErrorPayload({
        properties: objToPropertiesPayload({
          ['Error Type']: 'ValidationError',
          ['Error Message']: 'Invalid input data provided',
        }),
        tooltipText: 'ValidationError: Invalid input data provided',
      }),
    ),
  );

  profiler.measure('measure-details-error', {
    start: 'measure-details-error:start',
    end: 'measure-details-error:end',
    ...asOptions(
      trackEntryErrorPayload({
        ...trackMetaPayload,
        properties: objToPropertiesPayload({
          ['Error Type']: 'ValidationError',
          ['Error Message']: 'Invalid input data provided',
        }),
        tooltipText: 'ValidationError: Invalid input data provided',
      }),
    ),
  });

  profiler.mark(
    'measure-details-devtools:start',
    asOptions(trackEntryPayload(trackMetaPayload)),
  );
  await sleep(10);
  profiler.mark(
    'measure-details-devtools:end',
    asOptions(trackEntryPayload(trackMetaPayload)),
  );

  profiler.measure('measure-details-devtools', {
    start: 'measure-details-devtools:start',
    end: 'measure-details-devtools:end',
    ...asOptions(
      trackEntryPayload({
        ...trackMetaPayload,
        color: 'primary',
      }),
    ),
  });

  await sleep(10);

  profiler.mark('measure-details-devtools-error:start');
  await sleep(10);
  profiler.mark(
    'measure-details-devtools-error:end',
    asOptions(
      markerErrorPayload({
        ...trackMetaPayload,
        properties: objToPropertiesPayload({
          ['Error Type']: 'ValidationError',
          ['Error Message']: 'Invalid input data provided',
        }),
        tooltipText: 'ValidationError: Invalid input data provided',
      }),
    ),
  );

  profiler.measure('measure-details-devtools-error', {
    start: 'measure-details-devtools-error:start',
    end: 'measure-details-devtools-error:end',
    ...asOptions(
      trackEntryErrorPayload({
        ...trackMetaPayload,
        properties: objToPropertiesPayload({
          ['Error Type']: 'ValidationError',
          ['Error Message']: 'Invalid input data provided',
        }),
        tooltipText: 'ValidationError: Invalid input data provided',
      }),
    ),
  });
}

runTest();
