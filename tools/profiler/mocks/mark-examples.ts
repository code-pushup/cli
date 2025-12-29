import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

/**
 * Comprehensive examples of marks with various details configurations
 * Demonstrates progression from basic marks to complex devtools metadata
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'mark-examples',
  });

  console.log('=== MARK EXAMPLES ===\n');

  // 1. Basic marks (no details)
  console.log('1. Basic marks (no details)');
  const mark1 = profiler.mark('mark-start');
  await sleep(50);

  const mark2 = profiler.mark('mark-end');
  await sleep(50);

  // 2. Marks with simple string details
  console.log('2. Marks with simple string details');
  profiler.mark('mark-string-details', {
    detail: 'Simple string detail',
  });
  await sleep(50);

  // 3. Marks with object details
  console.log('3. Marks with object details');
  profiler.mark('mark-object-details', {
    detail: {
      operation: 'user_login',
      userId: 12345,
      timestamp: Date.now(),
    },
  });
  await sleep(50);

  // 4. Marks with nested object details
  console.log('4. Marks with nested object details');
  profiler.mark('mark-nested-details', {
    detail: {
      http: {
        method: 'POST',
        url: '/api/login',
        statusCode: 200,
        responseTime: 45,
      },
      user: {
        id: 12345,
        role: 'premium',
        lastLogin: '2024-01-15T10:30:00Z',
      },
      metadata: {
        source: 'web_app',
        version: '2.1.0',
        environment: 'production',
      },
    },
  });
  await sleep(50);

  // 5. Marks with basic devtools details
  console.log('5. Marks with basic devtools details');
  // Database query execution mark (from original mark.ts)
  const mark3 = profiler.mark('mark-user-login-query', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Database Operations',
        trackGroup: 'Authentication',
        color: 'tertiary',
        properties: [
          ['Query Type', 'SELECT'],
          ['Table', 'users'],
          ['Conditions', 'email = ? AND active = true'],
          ['Indexes Used', 'idx_users_email'],
          ['Rows Returned', '1'],
          ['Execution Time', '< 5ms'],
          ['Connection Pool', 'primary-db'],
        ],
        tooltipText: 'User authentication database query - fast indexed lookup',
      },
    },
  });
  await sleep(50);

  // 6. Marks with comprehensive devtools details
  console.log('6. Marks with comprehensive devtools details');
  profiler.mark('mark-devtools-comprehensive', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'API Operations',
        trackGroup: 'User Management',
        color: 'secondary-dark',
        properties: [
          ['Operation', 'User Profile Update'],
          ['User ID', 'usr_123456'],
          ['Fields Updated', 'name, email, preferences'],
          ['Validation Passed', '✓'],
          ['Database Impact', '2 rows affected'],
          ['Cache Invalidated', 'user:123456, profile:123456'],
          ['Audit Log Entry', 'audit_789012'],
          ['Webhook Triggered', 'user_updated'],
          ['Email Notification', 'Queued'],
          ['Search Index Updated', '✓'],
        ],
        tooltipText:
          'Complete user profile update operation with all side effects',
      },
    },
  });
  await sleep(50);

  // 7. Mark with custom timing and details
  console.log('7. Mark with custom startTime and details');
  const customStartTime = performance.now() - 25; // Mark as if it started 25ms ago
  profiler.mark('mark-custom-timing', {
    startTime: customStartTime,
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Performance Markers',
        trackGroup: 'Custom Timings',
        color: 'tertiary',
        properties: [
          ['Marker Type', 'Custom Start Time'],
          ['Offset from Now', '25ms ago'],
          ['Use Case', 'Retroactive timing'],
          ['Accuracy', 'Approximate'],
        ],
        tooltipText: 'Demonstrating custom startTime parameter',
      },
    },
  });
  await sleep(50);

  // 8. API request completion mark (from original mark.ts)
  console.log('8. API request completion mark (from original examples)');
  const mark4 = profiler.mark('mark-api-response-received', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Network Requests',
        trackGroup: 'API Calls',
        color: 'primary-light',
        properties: [
          ['Method', 'POST'],
          ['Endpoint', '/api/v1/users/profile'],
          ['Status Code', '200'],
          ['Response Size', '2.4 KB'],
          ['Content-Type', 'application/json'],
          ['Cache Status', 'HIT'],
          ['Response Time', '45ms'],
          ['Rate Limit', '98/100 requests remaining'],
        ],
        tooltipText:
          'User profile API request - cached response, good performance',
      },
    },
  });

  console.log('\n=== MARK EXAMPLES COMPLETE ===');
  console.log('Demonstrated:');
  console.log('  • Basic marks without details');
  console.log('  • String, object, and nested object details');
  console.log('  • DevTools metadata with tracks, colors, and properties');
  console.log('  • Custom timing with startTime parameter');
  console.log('  • Real-world examples (database queries, API calls)');
  console.log('');
  console.log('Check the generated trace files for visualization');
}

runTest().catch(console.error);
