import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../src/index.ts';

/**
 * Helper function to get hex codes for DevTools colors
 * Based on Chrome DevTools color scheme
 */
function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    primary: '#1A73E8', // Blue
    'primary-light': '#4285F4', // Light blue
    'primary-dark': '#0D47A1', // Dark blue
    secondary: '#34A853', // Green
    'secondary-light': '#4CAF50', // Light green
    'secondary-dark': '#2E7D32', // Dark green
    tertiary: '#EA4335', // Red
    'tertiary-light': '#FF6B6B', // Light red/coral
    'tertiary-dark': '#C62828', // Dark red
    error: '#D93025', // Error red
  };
  return colorMap[color] || '#9E9E9E'; // Grey fallback
}

/**
 * Helper function to get accessibility information for colors
 */
function getAccessibility(color: string): string {
  const accessibilityMap: Record<string, string> = {
    primary: 'High contrast, good visibility',
    'primary-light': 'Good contrast, readable on dark backgrounds',
    'primary-dark': 'Excellent contrast, accessible',
    secondary: 'High contrast, nature-inspired green',
    'secondary-light': 'Good contrast, soft green tone',
    'secondary-dark': 'Strong contrast, deep green',
    tertiary: 'High contrast, attention-grabbing',
    'tertiary-light': 'Moderate contrast, warm tone',
    'tertiary-dark': 'Excellent contrast, bold red',
    error: 'Maximum contrast, WCAG AA compliant',
  };
  return accessibilityMap[color] || 'Standard contrast';
}

/**
 * Comprehensive examples of devtools details configurations
 * Shows different tracks, colors, properties, and use cases
 * Demonstrates building up complexity from basic to advanced
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'devtools-details-examples',
    spans: {
      api: {
        track: 'API Operations',
        group: 'Backend Services',
        color: 'primary',
      },
      db: {
        track: 'Database',
        group: 'Data Layer',
        color: 'secondary',
      },
      cache: {
        track: 'Cache Operations',
        group: 'Performance',
        color: 'tertiary',
      },
      ui: {
        track: 'UI Interactions',
        group: 'Frontend',
        color: 'primary-light',
      },
    },
  });

  // Example 1: Basic Links (id/parentId) - API → Database Chain
  console.log(
    '   Shows hierarchical relationships - links auto-highlight on hover',
  );

  await profiler.spanAsync(
    'api-user-login',
    async () => {
      await sleep(30);
      return { success: true, userId: 123 };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'API Operations',
          trackGroup: 'Backend Services',
          color: 'primary',
          properties: [
            ['Method', 'POST'],
            ['Endpoint', '/auth/login'],
            ['Status', '200 OK'],
            ['Linked Events', 'Triggers db-user-lookup'],
          ],
          tooltipText:
            'API call that triggers database operation - hover to see linked events',
        },
      },
      id: 'auth-api-123',
    },
  );

  await profiler.spanAsync(
    'db-user-lookup',
    async () => {
      await sleep(15);
      return { user: { id: 123, name: 'John Doe' } };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Database',
          trackGroup: 'Data Layer',
          color: 'secondary',
          properties: [
            ['Query Type', 'SELECT'],
            ['Table', 'users'],
            ['Index Used', 'idx_users_email'],
            ['Rows Returned', '1'],
            ['Execution Time', '12ms'],
            ['Parent Link', 'auth-api-123'],
          ],
          tooltipText:
            'Database query linked to parent API call - relationships auto-highlight',
        },
      },
      parentId: 'auth-api-123',
      id: 'db-query-456',
    },
  );

  // Example 2: Flow Arrows (flowIn/flowOut) - WebSocket Broadcast → Clients
  console.log(
    '2. Flow Arrows (flowIn/flowOut) - WebSocket Broadcast → Clients',
  );

  await profiler.spanAsync(
    'websocket-broadcast',
    async () => {
      await sleep(25);
      return { clients: 1250, messageSize: 1024 };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Real-time Operations',
          trackGroup: 'Critical Infrastructure',
          color: 'primary-dark',
          properties: [
            ['Operation', 'Broadcast Message'],
            ['Connected Clients', '1,250'],
            ['Message Size', '1 KB'],
            ['Flow Direction', '→ client-delivery-001, client-delivery-002'],
            ['Track Behavior', 'Sticky/Pinned'],
          ],
          tooltipText:
            'Broadcast operation with outgoing flow arrows to client deliveries',
        },
      },
      id: 'broadcast-789',
      flowOut: ['client-001-delivery', 'client-002-delivery'],
    },
  );

  await profiler.spanAsync(
    'client-001-delivery',
    async () => {
      await sleep(8);
      return { clientId: 'client-001', delivered: true };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Client Operations',
          trackGroup: 'WebSocket Clients',
          color: 'secondary-light',
          properties: [
            ['Client ID', 'client-001'],
            ['Delivery Status', 'Success'],
            ['Flow Direction', '← broadcast-789'],
            ['Network Latency', '8ms'],
          ],
          tooltipText:
            'Client delivery with incoming flow arrow from broadcast',
        },
      },
      parentId: 'broadcast-789',
      id: 'client-001-delivery',
      flowIn: 'broadcast-789',
    },
  );

  // Example 3: Sticky Tracks - Critical Infrastructure

  await profiler.spanAsync(
    'realtime-metrics-update',
    async () => {
      await sleep(35);
      return { activeUsers: 15420, serverLoad: '67%' };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Critical Operations',
          trackGroup: 'Critical Infrastructure',
          color: 'tertiary-dark',
          properties: [
            ['Operation', 'Real-time Metrics'],
            ['Active Users', '15,420'],
            ['Server Load', '67%'],
            ['Update Frequency', '1Hz'],
            ['Track Behavior', 'Always Visible (Sticky)'],
          ],
          tooltipText:
            'Critical infrastructure operation - track stays pinned during navigation',
        },
      },
    },
  );

  // Example 4: Error Recovery with Links - Error → Recovery Chain

  await profiler
    .spanAsync(
      'api-rate-limit-error',
      async () => {
        await sleep(45);
        throw new Error('RATE_LIMIT_EXCEEDED');
      },
      {
        detail: {
          devtools: {
            dataType: 'track-entry',
            track: 'API Operations',
            trackGroup: 'Backend Services',
            color: 'tertiary',
            properties: [
              ['Error Type', 'Rate Limit Exceeded'],
              ['HTTP Status', '429'],
              ['Retry After', '60s'],
              ['Triggers Recovery', 'recovery-sequence-101'],
            ],
            tooltipText: 'Rate limit error that triggers recovery sequence',
          },
        },
        id: 'rate-limit-error-202',
      },
    )
    .catch(() => {}); // Expected error

  await profiler.spanAsync(
    'recovery-sequence',
    async () => {
      await sleep(150);
      return { recovered: true, fallbackUsed: true };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Error Recovery',
          trackGroup: 'Resilience',
          color: 'secondary',
          properties: [
            ['Recovery Strategy', 'Circuit Breaker + Cache'],
            ['Recovery Time', '150ms'],
            ['User Impact', 'Minimal'],
            ['Linked to Error', 'rate-limit-error-202'],
          ],
          tooltipText: 'Recovery sequence linked to parent error event',
        },
      },
      id: 'recovery-sequence-101',
      parentId: 'rate-limit-error-202',
      flowIn: 'rate-limit-error-202',
    },
  );

  // Example 5: Complex Properties Showcase
  console.log(
    '   Demonstrates rich metadata and comprehensive operation details',
  );

  await profiler.spanAsync(
    'user-onboarding-flow',
    async () => {
      await sleep(280);
      return {
        userId: 789,
        stepsCompleted: 8,
        integrationsTriggered: 5,
        notificationsSent: 3,
      };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Business Logic',
          trackGroup: 'User Workflows',
          color: 'primary',
          properties: [
            ['Workflow Type', 'User Onboarding'],
            ['Steps Completed', '8/8'],
            ['Database Writes', '12 tables'],
            ['External APIs', '3 services'],
            ['Email Notifications', '3 sent'],
            ['SMS Notifications', '1 sent'],
            ['Cache Updates', '7 keys'],
            ['Search Index', 'Updated'],
            ['Audit Events', '15 logged'],
            ['Business Rules', '23 evaluated'],
            ['Validation Rules', '31 passed'],
            ['Security Checks', '5 passed'],
            ['Performance SLA', '✓ Met (280ms < 500ms)'],
            ['Error Rate', '0.00%'],
          ],
          tooltipText:
            'Complete user onboarding with all side effects, validations, and integrations',
        },
      },
    },
  );

  // Example 6: Transaction Chain with Flow Array
  console.log(
    '   Shows complex multi-step operations with multiple flow connections',
  );

  await profiler.spanAsync(
    'distributed-transaction',
    async () => {
      await sleep(200);
      return {
        transactionId: 'txn-999',
        participants: 4,
        coordinator: 'service-a',
        timeout: 30000,
      };
    },
    {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Distributed Systems',
          trackGroup: 'Transactions',
          color: 'primary-light',
          properties: [
            ['Transaction ID', 'txn-999'],
            ['Coordination', '2PC Protocol'],
            ['Participants', '4 services'],
            ['Isolation Level', 'SERIALIZABLE'],
            ['Timeout', '30s'],
            [
              'Flow Targets',
              '→ prepare-phase, → commit-phase, → rollback-if-needed',
            ],
            ['Success Rate', '99.97%'],
          ],
          tooltipText:
            'Distributed transaction with multiple flow connections to phases',
        },
      },
      id: 'distributed-txn-999',
      flowOut: ['prepare-phase', 'commit-phase', 'rollback-if-needed'],
    },
  );

  // Example 7: Color Showcase - All Available DevTools Colors

  const colors: Array<{
    name: string;
    color: any;
    description: string;
    trackName: string;
    groupName: string;
  }> = [
    {
      name: 'Primary',
      color: 'primary' as const,
      description: 'Main operations - API calls, business logic',
      trackName: 'Core Operations',
      groupName: 'Primary Colors',
    },
    {
      name: 'Primary Light',
      color: 'primary-light' as const,
      description: 'Related primary operations - async tasks, background jobs',
      trackName: 'Async Operations',
      groupName: 'Primary Colors',
    },
    {
      name: 'Primary Dark',
      color: 'primary-dark' as const,
      description:
        'Critical primary operations - system initialization, core setup',
      trackName: 'Critical Operations',
      groupName: 'Primary Colors',
    },
    {
      name: 'Secondary',
      color: 'secondary' as const,
      description: 'Data operations - database queries, file I/O',
      trackName: 'Data Operations',
      groupName: 'Secondary Colors',
    },
    {
      name: 'Secondary Light',
      color: 'secondary-light' as const,
      description: 'Light data operations - caching, memory operations',
      trackName: 'Cache Operations',
      groupName: 'Secondary Colors',
    },
    {
      name: 'Secondary Dark',
      color: 'secondary-dark' as const,
      description: 'Heavy data operations - bulk processing, data migration',
      trackName: 'Bulk Operations',
      groupName: 'Secondary Colors',
    },
    {
      name: 'Tertiary',
      color: 'tertiary' as const,
      description: 'Infrastructure operations - networking, monitoring',
      trackName: 'Infrastructure',
      groupName: 'Tertiary Colors',
    },
    {
      name: 'Tertiary Light',
      color: 'tertiary-light' as const,
      description: 'Light infrastructure - health checks, metrics collection',
      trackName: 'Monitoring',
      groupName: 'Tertiary Colors',
    },
    {
      name: 'Tertiary Dark',
      color: 'tertiary-dark' as const,
      description: 'Critical infrastructure - failover, disaster recovery',
      trackName: 'Resilience',
      groupName: 'Tertiary Colors',
    },
    {
      name: 'Error',
      color: 'error' as const,
      description: 'Error conditions - failures, exceptions, timeouts',
      trackName: 'Error Handling',
      groupName: 'Status Colors',
    },
  ];

  for (const colorDef of colors) {
    await profiler.spanAsync(
      `color-showcase-${colorDef.color}`,
      async () => {
        await sleep(15);
        return { color: colorDef.color, demonstrated: true };
      },
      {
        detail: {
          devtools: {
            dataType: 'track-entry',
            track: colorDef.trackName,
            trackGroup: colorDef.groupName,
            color: colorDef.color,
            properties: [
              ['Color Name', colorDef.name],
              ['Color Value', colorDef.color],
              ['Use Case', colorDef.description],
              ['Hex Code', getColorHex(colorDef.color)],
              ['CSS Class', `devtools-${colorDef.color}`],
              ['Accessibility', getAccessibility(colorDef.color)],
            ],
            tooltipText: `${colorDef.name} color (${colorDef.color}) - ${colorDef.description}`,
          },
        },
      },
    );
  }

  console.log(
    'Generated comprehensive examples showcasing key DevTools features:',
  );
  console.log(
    '  1. Basic Links (id/parentId) - Hierarchical relationships with auto-highlighting',
  );
  console.log(
    '  2. Flow Arrows (flowIn/flowOut) - Directional data flow visualization',
  );
  console.log(
    '  4. Error Recovery Links - Error propagation and recovery chains',
  );
  console.log(
    '  5. Complex Properties - Rich metadata and comprehensive details',
  );
  console.log(
    '  6. Transaction Flow Arrays - Multi-step operations with multiple connections',
  );
  console.log(
    '  7. Color Showcase - Complete DevTools color palette demonstration',
  );
  console.log(
    '  • Secondary (Green): secondary, secondary-light, secondary-dark',
  );
  console.log(
    'Open the trace files in Chrome DevTools Performance tab to visualize',
  );
  console.log(
    'Hover over events to see auto-highlighting of linked relationships!',
  );
  console.log(
    'Compare color usage across different operation types for optimal visualization.',
  );
}

runTest();
