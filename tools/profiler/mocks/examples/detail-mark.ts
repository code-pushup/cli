import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import { getMeasureMarkNames } from '../../src/lib/profiler-utils';
import {
  createTrackMark,
  propertiesFrom,
} from '../../src/lib/user-timing-details-utils';

async function run() {
  performance.mark(getMeasureMarkNames('details-mark').startName, {
    detail: {
      str: 'This is a string value',
      num: 42,
      obj: {
        num: 42,
      },
      array: [42, 42, 42],
    },
  });
  await sleep(10);
  await (async () => {
    const { startName, endName, measureName } = getMeasureMarkNames(
      'detail-mark-devtools',
    );
    performance.mark(startName);
    await sleep(10);
    performance.mark(endName);
    performance.measure(measureName, {
      start: startName,
      end: endName,
      detail: {
        str: 'This is a string value',
        num: 42,
        obj: {
          num: 42,
        },
        array: [42, 42, 42],
      },
    });
  })();
  getProfiler({
    enabled: true,
    fileBaseName: 'detail-mark',
    captureBuffered: true,
  });
}

run();
