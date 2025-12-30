import { setTimeout as sleep } from 'timers/promises';
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

  profiler.mark('measure-details:start');
  await sleep(10);
  profiler.mark('measure-details:end');

  profiler.measure('measure-details', {
    start: 'measure-details:start',
    end: 'measure-details:end',
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

  profiler.mark('measure-details-error:start');
  await sleep(10);
  profiler.mark('measure-details-error:end', {
    detail: {
      devtools: {
        // track // has to be not present to brint the error as top lable
        dataType: 'marker', // required for error rendering
        color: 'error', // required for error rendering
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  profiler.measure('measure-details-error', {
    start: 'measure-details-error:start',
    end: 'measure-details-error:end',
    detail: {
      devtools: {
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  const detail = {
    devtools: {
      dataType: 'track-entry',
      track: 'Program',
      trackGroup: 'Main Process',
    },
  };
  profiler.mark('measure-details-devtools:start', { detail });
  await sleep(10);
  profiler.mark('measure-details-devtools:end', { detail });

  profiler.measure('measure-details-devtools', {
    start: 'measure-details-devtools:start',
    end: 'measure-details-devtools:end',
    detail: {
      devtools: {
        ...detail.devtools,
        color: 'primary',
        properties: [
          ['str', 'This is a detail.devtools property'],
          ['num', 42],
          ['object', { str: '42', num: 42 }],
          ['array', [42, 42, 42]],
        ],
        tooltipText: 'This is a tooltip text for the measure',
      },
    },
  });

  await sleep(10);

  profiler.mark('measure-details-devtools-error:start');
  await sleep(10);
  profiler.mark('measure-details-devtools-error:end', {
    detail: {
      devtools: {
        dataType: 'marker', // required for error rendering
        color: 'error', // required for error rendering
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  profiler.measure('measure-details-devtools-error', {
    start: 'measure-details-devtools-error:start',
    end: 'measure-details-devtools-error:end',
    detail: {
      devtools: {
        ...detail.devtools,
        color: 'error', // required for error color
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });
}

runTest();
