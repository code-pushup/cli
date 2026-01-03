import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import { getMeasureMarkNames } from '../../src/lib/performance-utils';
import {
  createLabel,
  createLabelError,
  extensionMarkerWarningPayload,
  objToPropertiesPayload,
} from '../../src/lib/user-timing-details-utils';

async function run() {
  performance.mark(getMeasureMarkNames('default-mark-label').startName, {
    detail: {
      devtools: createLabel({
        // color:'primary' is default
        tooltipText: 'This is a default label',
      }),
    },
  });
  await sleep(10);
  performance.mark(getMeasureMarkNames('primary-mark-label').startName, {
    detail: {
      devtools: createLabel({
        color: 'secondary',
        tooltipText: 'This is a primary label',
        properties: objToPropertiesPayload({
          'Property Info': 'This is a primary label',
        }),
      }),
    },
  });
  await sleep(10);
  performance.mark(getMeasureMarkNames('error-mark-label').startName, {
    detail: {
      devtools: createLabelError({
        tooltipText: 'This is a error label',
      }),
    },
  });
  await sleep(10);
  performance.mark(getMeasureMarkNames('warn-mark-label').startName, {
    detail: {
      devtools: extensionMarkerWarningPayload({
        tooltipText: 'This is a warning label',
      }),
    },
  });

  getProfiler({
    fileBaseName: 'detail-devtools-label',
    enabled: true,
    captureBuffered: true,
  });
}

run();
