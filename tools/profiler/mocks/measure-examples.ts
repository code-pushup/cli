import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

/**
 * Comprehensive examples of measures with various details configurations
 * Demonstrates progression from basic measurements to complex devtools metadata
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'measure-examples',
  });

  console.log('=== MEASURE EXAMPLES ===\n');

  // Create reference marks for all measurements
  profiler.mark('mark-global-start');
  await sleep(10);

  // 1. Basic measures (no details)
  console.log('1. Basic measures (no details)');
  profiler.mark('mark-start');
  await sleep(25);
  profiler.mark('mark-end');

  const measure1 = profiler.measure(
    'basic-measure-1',
    'mark-start',
    'mark-end',
  );
  console.log(`   Duration: ${measure1.duration.toFixed(2)}ms`);

  const measure2 = profiler.measure('basic-measure-2', 'mark-start'); // To current time
  console.log(`   Duration: ${measure2.duration.toFixed(2)}ms`);
  await sleep(50);

  // 2. Measures with simple string details
  console.log('2. Measures with simple string details');
  profiler.mark('mark-string-start');
  await sleep(30);
  profiler.mark('mark-string-end');

  const measure3 = profiler.measure(
    'string-details-measure',
    'mark-string-start',
    'mark-string-end',
    {
      detail: 'Combined measurement with string detail',
    },
  );
  console.log(`   Duration: ${measure3.duration.toFixed(2)}ms`);
  await sleep(50);

  // 3. Measures with object details
  console.log('3. Measures with object details');
  profiler.mark('mark-object-start');
  await sleep(20);
  profiler.mark('mark-object-end');

  const measure4 = profiler.measure('object-details-measure', {
    start: 'mark-object-start',
    end: 'mark-object-end',
    detail: {
      phase: 'data-processing',
      operations: ['validation', 'transformation', 'storage'],
      success: true,
      retryCount: 0,
      dataSize: '1.2 MB',
    },
  });
  console.log(`   Duration: ${measure4.duration.toFixed(2)}ms`);
  await sleep(50);

  // 4. Measures with nested object details
  console.log('4. Measures with nested object details');
  profiler.mark('mark-nested-start');
  await sleep(40);
  profiler.mark('mark-nested-end');

  const measure5 = profiler.measure('nested-details-measure', {
    start: 'mark-nested-start',
    end: 'mark-nested-end',
    detail: {
      test: {
        name: 'Performance Test Suite',
        type: 'Integration',
        version: '1.2.3',
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      metrics: {
        phases: 3,
        totalOperations: 15,
        successRate: '100%',
        avgResponseTime: '32ms',
      },
    },
  });
  console.log(`   Duration: ${measure5.duration.toFixed(2)}ms`);
  await sleep(50);

  // 5. Measures with basic devtools details
  console.log('5. Measures with basic devtools details');
  profiler.mark('mark-devtools-basic-start');
  await sleep(15);
  profiler.mark('mark-devtools-basic-end');

  const measure6 = profiler.measure('devtools-basic-measure', {
    start: 'mark-devtools-basic-start',
    end: 'mark-devtools-basic-end',
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Function Calls',
        trackGroup: 'Business Logic',
        color: 'primary-light',
        properties: [
          ['Function', 'processUserData'],
          ['Input Size', '1.2 KB'],
          ['Output Size', '3.4 KB'],
          ['Processing Steps', '3'],
        ],
        tooltipText: 'User data processing function execution',
      },
    },
  });
  console.log(`   Duration: ${measure6.duration.toFixed(2)}ms`);
  await sleep(50);

  // 6. Measures with comprehensive devtools details
  console.log('6. Measures with comprehensive devtools details');
  profiler.mark('mark-comprehensive-start');
  await sleep(80);
  profiler.mark('mark-comprehensive-end');

  const measure7 = profiler.measure('devtools-comprehensive-measure', {
    start: 'mark-comprehensive-start',
    end: 'mark-comprehensive-end',
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'API Endpoints',
        trackGroup: 'User Service',
        color: 'secondary',
        properties: [
          ['Endpoint', 'POST /api/users/profile/update'],
          ['Authentication', 'JWT Bearer Token'],
          ['Request Size', '2.1 KB'],
          ['Response Size', '1.8 KB'],
          ['Database Queries', '3'],
          ['Cache Operations', '2 reads, 1 write'],
          ['External API Calls', '1 (payment service)'],
          ['Validation Rules', '12 applied'],
          ['Business Rules', '5 executed'],
          ['Audit Events', '2 logged'],
          ['Notifications', '1 email queued'],
          ['Performance Score', 'A (95/100)'],
        ],
        tooltipText:
          'Complete user profile update API call with full request lifecycle',
      },
    },
  });
  console.log(`   Duration: ${measure7.duration.toFixed(2)}ms`);
  await sleep(50);

  // 7. Measure with custom timing details
  console.log('7. Measure with custom timing and details');
  const measure8 = profiler.measure('custom-timing-measure', {
    start: performance.now() - 100, // Start 100ms ago
    duration: 75, // Fixed duration
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Custom Measurements',
        trackGroup: 'Debug Tools',
        color: 'tertiary-light',
        properties: [
          ['Timing Mode', 'Custom Start + Duration'],
          ['Start Offset', '100ms ago'],
          ['Fixed Duration', '75ms'],
          ['Use Case', 'Simulated operation'],
          ['Accuracy', 'Programmatic control'],
        ],
        tooltipText: 'Demonstrating custom start time and duration parameters',
      },
    },
  });
  console.log(`   Duration: ${measure8.duration.toFixed(2)}ms`);
  await sleep(50);

  // 8. Real-world examples (from original measure.ts)
  console.log(
    '8. Real-world examples (Page Load, Database Transaction, Build Process)',
  );

  // Page load performance measurement
  const measure9 = profiler.measure('page-load-complete', {
    start: 'mark-global-start',
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Page Load Performance',
        trackGroup: 'User Experience',
        color: 'primary-dark',
        properties: [
          ['Load Type', 'Full Page Load'],
          ['DOMContentLoaded', '1.2s'],
          ['Load Event', '2.8s'],
          ['First Paint', '0.8s'],
          ['First Contentful Paint', '1.1s'],
          ['Largest Contentful Paint', '2.1s'],
          ['Cumulative Layout Shift', '0.02'],
          ['Total Resources', '47'],
          ['Total Transfer Size', '3.2 MB'],
          ['Cache Hit Rate', '68%'],
          ['Connection Type', '4G'],
        ],
        tooltipText:
          'Complete page load performance - good user experience metrics',
      },
    },
  });
  console.log(`   Page Load Duration: ${measure9.duration.toFixed(2)}ms`);

  // Database transaction measurement
  const measure10 = profiler.measure('db-transaction-commit', {
    start: 'mark-global-start',
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Database Operations',
        trackGroup: 'Transactions',
        color: 'tertiary-dark',
        properties: [
          ['Transaction Type', 'User Registration'],
          ['Tables Modified', 'users, user_profiles, email_verifications'],
          ['Rows Inserted', '3'],
          ['Indexes Updated', '5'],
          ['Lock Wait Time', '2ms'],
          ['Transaction Size', '1.8 KB'],
          ['Isolation Level', 'READ COMMITTED'],
          ['Rollback Risk', 'Low'],
          ['Connection Reused', 'Yes'],
        ],
        tooltipText:
          'Multi-table user registration transaction - completed successfully',
      },
    },
  });
  console.log(`   Transaction Duration: ${measure10.duration.toFixed(2)}ms`);

  // Build process measurement
  const measure11 = profiler.measure('webpack-build-complete', {
    start: 'mark-global-start',
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Build Process',
        trackGroup: 'Development Tools',
        color: 'secondary-light',
        properties: [
          ['Build Tool', 'Webpack 5.89.0'],
          ['Build Mode', 'Production'],
          ['Entry Points', '3'],
          ['Modules Processed', '1,247'],
          ['Chunks Created', '12'],
          ['Bundle Size', '2.4 MB'],
          ['Gzip Size', '634 KB'],
          ['Compression Ratio', '74%'],
          ['Source Maps', 'Generated'],
          ['Optimization', 'Terser + CSS Minimizer'],
        ],
        tooltipText:
          'Production build completed - optimized bundle with good compression',
      },
    },
  });
  console.log(`   Build Duration: ${measure11.duration.toFixed(2)}ms`);

  console.log('\n=== MEASURE EXAMPLES COMPLETE ===');
  console.log('Demonstrated:');
  console.log('  • Basic measurements with different overloads');
  console.log('  • String, object, and nested object details');
  console.log('  • DevTools metadata with comprehensive properties');
  console.log('  • Custom timing with start/duration parameters');
  console.log('  • Real-world examples (page load, transactions, builds)');
  console.log('  • Performance metrics and duration logging');
  console.log('');
  console.log('Check the generated trace files for visualization');
  console.log('All measures captured with their details data');
}

runTest().catch(console.error);
