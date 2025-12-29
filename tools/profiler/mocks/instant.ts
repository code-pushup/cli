import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    fileBaseName: 'instant-events-test',
  });

  // User interaction event
  const mark1 = profiler.instant('user-click-submit', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'User Interactions',
        trackGroup: 'Form Events',
        color: 'primary-light',
        properties: [
          ['Event Type', 'click'],
          ['Target Element', 'button[type="submit"]'],
          ['Form ID', 'user-registration'],
          ['Page Context', '/signup'],
          ['User Agent', 'Chrome 120.0.0'],
          ['Session ID', 'sess_abc123'],
          ['Conversion Funnel', 'Step 3 of 5'],
          ['A/B Test Variant', 'B'],
        ],
        tooltipText: 'User clicked submit button on registration form',
      },
    },
  });
  await sleep(100);

  // Error event
  const mark2 = profiler.instant('api-error-occurred', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Error Events',
        trackGroup: 'Application Errors',
        color: 'error',
        properties: [
          ['Error Type', 'NetworkError'],
          ['Error Code', 'ECONNREFUSED'],
          ['Endpoint', '/api/v1/payment/process'],
          ['HTTP Method', 'POST'],
          ['User Impact', 'High'],
          ['Retry Count', '3'],
          ['Error Message', 'Connection refused by payment service'],
          ['Fallback Triggered', 'Yes'],
          ['Monitoring Alert', 'Sent to #payments channel'],
        ],
        tooltipText:
          'Payment API connection failed - fallback payment method activated',
      },
    },
  });
  await sleep(100);

  // Test mark with startTime
  const mark3 = profiler.instant('start-mark-with-start-time', {
    startTime: performance.now() - 5,
  });
  await sleep(100);

  // System resource alert
  const mark4 = profiler.instant('memory-threshold-exceeded', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'System Resources',
        trackGroup: 'Infrastructure',
        color: 'warning',
        properties: [
          ['Resource Type', 'Memory'],
          ['Current Usage', '1.8 GB'],
          ['Threshold', '2.0 GB (90%)'],
          ['Growth Rate', '+120 MB/min'],
          ['Largest Objects', 'ImageCache: 450MB, UserSessions: 320MB'],
          ['GC Cycles', '47 in last 5 min'],
          ['Memory Pressure', 'High'],
          ['Auto-scaling', 'Triggered'],
          ['Recommendations', 'Consider cache eviction, horizontal scaling'],
        ],
        tooltipText:
          'Memory usage approaching critical threshold - auto-scaling initiated',
      },
    },
  });
}

runTest();
