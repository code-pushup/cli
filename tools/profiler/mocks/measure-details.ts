import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

/**
 * Demonstrates various ways to use details data with measures
 * Shows progression from simple details to complex devtools metadata
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'measure-details-test',
  });

  console.log('=== MEASURE DETAILS DEMONSTRATION ===\n');

  // Create some reference marks for measurements
  profiler.mark('mark-test-start');
  await sleep(10);
  profiler.mark('mark-phase-1-start');
  await sleep(25);
  profiler.mark('mark-phase-1-end');
  await sleep(10);
  profiler.mark('mark-phase-2-start');
  await sleep(40);
  profiler.mark('mark-phase-2-end');
  await sleep(10);
  profiler.mark('mark-test-end');

  // 1. Basic measure with no details
  console.log('1. Basic measure (no details)');
  const measure1 = profiler.measure(
    'basic-measure',
    'mark-phase-1-start',
    'mark-phase-1-end',
  );
  console.log(`   Duration: ${measure1.duration.toFixed(2)}ms`);
  await sleep(50);

  // 2. Measure with simple string details
  console.log('2. Measure with string details');
  const measure2 = profiler.measure(
    'string-details-measure',
    'mark-phase-1-start',
    'mark-phase-2-end',
    {
      detail: 'Combined phases measurement',
    },
  );
  console.log(`   Duration: ${measure2.duration.toFixed(2)}ms`);
  await sleep(50);

  // 3. Measure with object details
  console.log('3. Measure with object details');
  const measure3 = profiler.measure('object-details-measure', {
    start: 'mark-phase-1-start',
    end: 'mark-phase-1-end',
    detail: {
      phase: 'phase-1',
      operations: ['validation', 'processing'],
      success: true,
      retryCount: 0,
    },
  });
  console.log(`   Duration: ${measure3.duration.toFixed(2)}ms`);
  await sleep(50);

  // 4. Measure with nested object details
  console.log('4. Measure with nested object details');
  const measure4 = profiler.measure('nested-details-measure', {
    start: 'test-start',
    end: 'test-end',
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
        phases: 2,
        totalOperations: 15,
        successRate: '100%',
        avgResponseTime: '32ms',
      },
    },
  });
  console.log(`   Duration: ${measure4.duration.toFixed(2)}ms`);
  await sleep(50);

  // 5. Measure with basic devtools details
  console.log('5. Measure with basic devtools details');
  const measure5 = profiler.measure('devtools-basic-measure', {
    start: 'mark-phase-1-start',
    end: 'mark-phase-1-end',
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
  console.log(`   Duration: ${measure5.duration.toFixed(2)}ms`);
  await sleep(50);

  // 6. Measure with comprehensive devtools details
  console.log('6. Measure with comprehensive devtools details');
  const measure6 = profiler.measure('devtools-comprehensive-measure', {
    start: 'mark-phase-1-start',
    end: 'mark-test-end',
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
  console.log(`   Duration: ${measure6.duration.toFixed(2)}ms`);
  await sleep(50);

  // 7. Measure with custom timing details
  console.log('7. Measure with custom timing and details');
  const measure7 = profiler.measure('custom-timing-measure', {
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
  console.log(`   Duration: ${measure7.duration.toFixed(2)}ms`);

  console.log('\n=== MEASURE DETAILS DEMO COMPLETE ===');
  console.log('Check the generated trace files for visualization');
  console.log('All measures captured with their details data');
}

runTest().catch(console.error);
