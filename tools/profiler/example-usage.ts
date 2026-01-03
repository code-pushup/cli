/**
 * Example demonstrating DevTools-enhanced performance API usage
 */
// Import the type declarations
import '@code-pushup/profiler/perf_hooks';

// Now the global performance object has DevTools-aware overloads

// Example 1: Performance mark with DevTools metadata
performance.mark('app-start', {
  detail: {
    devtools: {
      dataType: 'marker',
      color: 'primary',
      tooltipText: 'Application startup mark',
      properties: [
        ['version', '1.0.0'],
        ['environment', 'production'],
      ],
    },
  },
});

// Example 2: Performance measure with DevTools metadata
performance.measure('boot-time', {
  start: 'app-start',
  end: 'app-ready',
  detail: {
    devtools: {
      dataType: 'track-entry',
      track: 'application',
      trackGroup: 'lifecycle',
      color: 'secondary',
      tooltipText: 'Time from app start to ready state',
    },
  },
});

// Example 3: Traditional usage still works
performance.mark('simple-mark');
performance.measure('simple-measure', 'start', 'end');
