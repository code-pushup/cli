import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.js';

/**
 * Demonstrates various ways to use details data with marks
 * Shows progression from simple details to complex devtools metadata
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'mark-details-test',
  });

  console.log('=== MARK DETAILS DEMONSTRATION ===\n');

  // 1. Simple mark with no details
  console.log('1. Basic mark (no details)');
  profiler.mark('basic-mark');
  await sleep(50);

  // 2. Mark with simple string details
  console.log('2. Mark with string details');
  profiler.mark('string-details-mark', {
    detail: 'Simple string detail',
  });
  await sleep(50);

  // 3. Mark with object details
  console.log('3. Mark with object details');
  profiler.mark('object-details-mark', {
    detail: {
      operation: 'user_login',
      userId: 12345,
      timestamp: Date.now(),
    },
  });
  await sleep(50);

  // 4. Mark with nested object details
  console.log('4. Mark with nested object details');
  profiler.mark('nested-details-mark', {
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

  // 5. Mark with devtools details (basic)
  console.log('5. Mark with basic devtools details');
  profiler.mark('devtools-basic-mark', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'User Actions',
        trackGroup: 'Authentication',
        color: 'primary',
        properties: [
          ['Action', 'Login'],
          ['Method', 'Email/Password'],
        ],
        tooltipText: 'User login attempt',
      },
    },
  });
  await sleep(50);

  // 6. Mark with comprehensive devtools details
  console.log('6. Mark with comprehensive devtools details');
  profiler.mark('devtools-comprehensive-mark', {
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
  profiler.mark('custom-timing-mark', {
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

  console.log('\n=== MARK DETAILS DEMO COMPLETE ===');
  console.log('Check the generated trace files for visualization');
}

runTest().catch(console.error);
