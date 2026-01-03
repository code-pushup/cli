import './src/perf_hooks';

// Test file to verify DevTools performance types work
const test = () => {
  // These should have autocomplete and type checking
  performance.mark('test-mark', {
    detail: {
      devtools: {
        dataType: 'marker',
        color: 'primary',
        tooltipText: 'Test mark',
      },
    },
  });

  performance.measure('test-measure', {
    start: 'start-mark',
    end: 'end-mark',
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'test-track',
        color: 'secondary',
      },
    },
  });
};
