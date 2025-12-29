import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../src/index.js';

/**
 * Extended span examples with nested spans and complex hierarchies
 * Demonstrates synchronous span nesting and hierarchical performance tracking
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'span-extended',
    spans: {
      main: {
        track: 'Main Operations',
        group: 'Application Flow',
        color: 'primary-dark',
      },
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
      processing: {
        track: 'Data Processing',
        group: 'Business Logic',
        color: 'secondary-light',
      },
    } as const,
  });

  console.log('=== EXTENDED SPAN EXAMPLES ===\n');

  // Example 1: Simple nested spans (2 levels)
  console.log('1. Simple nested spans (2 levels)');
  profiler.span(
    'user-registration-flow',
    () => {
      console.log('   Starting user registration...');

      // Nested span for validation
      profiler.span(
        'validate-user-data',
        () => {
          console.log('     Validating user input...');
          // Simulate validation work
          for (let i = 0; i < 50000; i++) {
            Math.sqrt(i);
          }
          return { valid: true, checksPassed: 8 };
        },
        {
          detail: profiler.spans.processing({
            properties: [
              ['Validation Type', 'User Registration'],
              ['Fields Validated', '8'],
              ['Rules Applied', '12'],
              ['Security Checks', '3'],
              ['Business Rules', '5'],
            ],
            tooltipText: 'Input validation for user registration form',
          }),
        },
      );

      // Nested span for database operations
      profiler.span(
        'create-user-account',
        () => {
          console.log('     Creating database records...');

          // Double-nested span for actual DB write
          profiler.span(
            'db-insert-user',
            () => {
              console.log('       Writing to users table...');
              for (let i = 0; i < 100000; i++) {
                Math.sin(i);
              }
              return { inserted: true, userId: 12345 };
            },
            {
              detail: profiler.spans.db({
                properties: [
                  ['Table', 'users'],
                  ['Operation', 'INSERT'],
                  ['Rows Affected', '1'],
                  ['Indexes Updated', '3'],
                  ['Triggers Fired', '2'],
                ],
                tooltipText: 'Database insert operation for new user',
              }),
            },
          );

          // Another nested span for profile creation
          profiler.span(
            'db-insert-profile',
            () => {
              console.log('       Writing to user_profiles table...');
              for (let i = 0; i < 75000; i++) {
                Math.cos(i);
              }
              return { inserted: true, profileId: 67890 };
            },
            {
              detail: profiler.spans.db({
                properties: [
                  ['Table', 'user_profiles'],
                  ['Operation', 'INSERT'],
                  ['Rows Affected', '1'],
                  ['Default Values', '12 fields'],
                  ['Foreign Key', 'users.id → 12345'],
                ],
                tooltipText: 'Profile creation with default settings',
              }),
            },
          );

          return { userCreated: true, profileCreated: true };
        },
        {
          detail: profiler.spans.db({
            properties: [
              ['Transaction Type', 'Multi-table User Creation'],
              ['Tables Modified', 'users, user_profiles'],
              ['Rows Inserted', '2'],
              ['Constraints Validated', '5'],
              ['Triggers Executed', '3'],
            ],
            tooltipText: 'Complete user account creation transaction',
          }),
        },
      );

      // Nested span for welcome email
      profiler.span(
        'send-welcome-email',
        () => {
          console.log('     Sending welcome email...');

          // Triple-nested span for email composition
          profiler.span(
            'compose-email-template',
            () => {
              console.log('       Composing email content...');
              for (let i = 0; i < 25000; i++) {
                String.fromCharCode((i % 26) + 97);
              }
              return { template: 'welcome-user', personalized: true };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Template', 'welcome-user'],
                  ['Personalization', 'User name, login URL'],
                  ['Variables Replaced', '8'],
                  ['Content Length', '1.2 KB'],
                ],
                tooltipText: 'Email template composition with personalization',
              }),
            },
          );

          // Triple-nested span for SMTP send
          profiler.span(
            'smtp-send-email',
            () => {
              console.log('       Sending via SMTP...');
              for (let i = 0; i < 30000; i++) {
                Math.random();
              }
              return { sent: true, messageId: 'msg-abc123' };
            },
            {
              detail: profiler.spans.api({
                properties: [
                  ['Protocol', 'SMTP'],
                  ['Server', 'smtp.company.com'],
                  ['Port', '587'],
                  ['TLS', 'Enabled'],
                  ['Authentication', 'OAuth2'],
                  ['Queue Time', '< 10ms'],
                  ['Delivery Time', '45ms'],
                ],
                tooltipText: 'SMTP email delivery with authentication',
              }),
            },
          );

          return { emailSent: true, deliveryConfirmed: true };
        },
        {
          detail: profiler.spans.api({
            properties: [
              ['Email Type', 'Welcome Message'],
              ['Recipient', 'new-user@domain.com'],
              ['Priority', 'Normal'],
              ['Template Used', 'welcome-user'],
              ['Attachments', '0'],
              ['Tracking Pixel', 'Included'],
            ],
            tooltipText: 'Welcome email delivery with tracking',
          }),
        },
      );

      return {
        success: true,
        userId: 12345,
        emailSent: true,
        accountActivated: true,
      };
    },
    {
      detail: profiler.spans.main({
        properties: [
          ['Operation', 'Complete User Registration'],
          ['Steps Completed', '4'],
          ['Database Transactions', '2'],
          ['External Services', '1 (Email)'],
          ['Validation Passed', '✓'],
          ['Account Status', 'Active'],
          ['Welcome Email', 'Sent'],
          ['Total Processing Time', 'Nested spans measured'],
        ],
        tooltipText:
          'End-to-end user registration with nested operations and external service calls',
      }),
    },
  );

  await sleep(200);

  // Example 2: Complex data processing pipeline (3 levels deep)
  console.log('2. Complex data processing pipeline (3 levels deep)');
  profiler.span(
    'process-monthly-report',
    () => {
      console.log('   Starting monthly report generation...');

      // Level 1: Data collection
      profiler.span(
        'collect-raw-data',
        () => {
          console.log('     Collecting raw data from sources...');

          // Level 2: Database queries
          profiler.span(
            'query-sales-data',
            () => {
              console.log('       Querying sales transactions...');
              for (let i = 0; i < 200000; i++) {
                Math.sin(i * 0.01);
              }
              return { records: 124789, tables: 3 };
            },
            {
              detail: profiler.spans.db({
                properties: [
                  ['Query Type', 'Monthly Aggregation'],
                  ['Tables Queried', 'sales, customers, products'],
                  ['Date Range', '2024-01-01 to 2024-01-31'],
                  ['Records Processed', '124,789'],
                  ['Memory Used', '45 MB'],
                ],
                tooltipText: 'Monthly sales data aggregation query',
              }),
            },
          );

          // Level 2: Cache data
          profiler.span(
            'fetch-cached-metadata',
            () => {
              console.log('       Fetching cached metadata...');
              for (let i = 0; i < 50000; i++) {
                Math.cos(i * 0.005);
              }
              return { cached: true, keys: 25, size: '2.1 MB' };
            },
            {
              detail: profiler.spans.cache({
                properties: [
                  ['Operation', 'MGET'],
                  ['Keys Retrieved', '25'],
                  ['Cache Hit Rate', '96%'],
                  ['Data Size', '2.1 MB'],
                  ['Compression', 'LZ4'],
                  ['TTL Remaining', '2-24 hours'],
                ],
                tooltipText: 'Bulk cache retrieval for report metadata',
              }),
            },
          );

          return { dataCollected: true, sources: 5, totalRecords: 124789 };
        },
        {
          detail: profiler.spans.api({
            properties: [
              ['Data Sources', 'Database + Cache'],
              ['Total Records', '124,789'],
              ['Data Freshness', '< 5 minutes'],
              ['Memory Buffer', '128 MB'],
              ['Parallel Queries', '3'],
            ],
            tooltipText: 'Multi-source data collection for monthly report',
          }),
        },
      );

      // Level 1: Data processing
      profiler.span(
        'process-report-data',
        () => {
          console.log('     Processing and aggregating data...');

          // Level 2: Calculations
          profiler.span(
            'calculate-metrics',
            () => {
              console.log('       Calculating KPIs and metrics...');
              for (let i = 0; i < 150000; i++) {
                Math.sqrt(i) * Math.sin(i * 0.001);
              }
              return { metrics: 15, calculations: 50000 };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Metrics Calculated', '15'],
                  ['Mathematical Operations', '50,000'],
                  ['Precision', '4 decimal places'],
                  ['Validation Rules', '8 applied'],
                  ['Outlier Detection', 'Applied'],
                ],
                tooltipText: 'Complex KPI calculations with validation',
              }),
            },
          );

          // Level 2: Data transformation
          profiler.span(
            'transform-data-format',
            () => {
              console.log('       Transforming data for presentation...');
              for (let i = 0; i < 100000; i++) {
                JSON.stringify({ value: i, formatted: i.toLocaleString() });
              }
              return { transformed: true, format: 'JSON', fields: 25 };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Transformation Type', 'JSON Formatting'],
                  ['Fields Processed', '25'],
                  ['Data Types', 'Number, Date, String'],
                  ['Localization', 'Applied'],
                  ['Size Increase', '15%'],
                ],
                tooltipText: 'Data transformation for presentation layer',
              }),
            },
          );

          return {
            processed: true,
            metricsCalculated: 15,
            dataFormatted: true,
          };
        },
        {
          detail: profiler.spans.processing({
            properties: [
              [
                'Processing Pipeline',
                'Collection → Calculation → Transformation',
              ],
              ['Data Records', '124,789'],
              ['Computed Metrics', '15'],
              ['Output Format', 'JSON'],
              ['Memory Peak', '89 MB'],
              ['CPU Utilization', '75%'],
            ],
            tooltipText:
              'Complete data processing pipeline with multiple transformations',
          }),
        },
      );

      // Level 1: Report generation
      profiler.span(
        'generate-report-output',
        () => {
          console.log('     Generating final report...');

          // Level 2: PDF generation
          profiler.span(
            'render-pdf-document',
            () => {
              console.log('       Rendering PDF document...');
              for (let i = 0; i < 80000; i++) {
                // Simulate PDF rendering work
                Math.atan(i * 0.0001);
              }
              return { rendered: true, pages: 12, size: '2.4 MB' };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Output Format', 'PDF'],
                  ['Pages Generated', '12'],
                  ['File Size', '2.4 MB'],
                  ['Resolution', '300 DPI'],
                  ['Fonts Embedded', '3'],
                  ['Images Included', '8'],
                ],
                tooltipText: 'PDF document rendering with embedded assets',
              }),
            },
          );

          // Level 2: Email delivery
          profiler.span(
            'email-report-delivery',
            () => {
              console.log('       Emailing report to stakeholders...');
              for (let i = 0; i < 25000; i++) {
                Math.random().toString(36);
              }
              return { sent: true, recipients: 5, attachments: 1 };
            },
            {
              detail: profiler.spans.api({
                properties: [
                  ['Recipients', '5 stakeholders'],
                  ['Attachments', '1 (monthly-report.pdf)'],
                  ['Priority', 'High'],
                  ['Delivery Confirmation', 'Requested'],
                  ['Bounce Handling', 'Enabled'],
                ],
                tooltipText: 'Report delivery to stakeholders via email',
              }),
            },
          );

          return { reportGenerated: true, delivered: true, stakeholders: 5 };
        },
        {
          detail: profiler.spans.main({
            properties: [
              ['Report Type', 'Monthly Sales Summary'],
              ['Time Period', 'January 2024'],
              ['Data Points', '124,789'],
              ['Pages Generated', '12'],
              ['File Size', '2.4 MB'],
              ['Delivery Method', 'Email'],
              ['Recipients', '5 stakeholders'],
            ],
            tooltipText:
              'Complete monthly report generation and delivery process',
          }),
        },
      );

      return {
        success: true,
        reportId: 'RPT-2024-01',
        recordsProcessed: 124789,
        stakeholdersNotified: 5,
        fileSize: '2.4 MB',
      };
    },
    {
      detail: profiler.spans.main({
        properties: [
          ['Operation', 'Monthly Report Generation'],
          ['Complexity', '3 Levels Deep Nesting'],
          ['Total Spans', '9 nested operations'],
          ['Data Sources', 'Database + Cache'],
          ['Processing Steps', 'Collection → Processing → Generation'],
          ['Output Formats', 'PDF + Email'],
          ['Performance Impact', 'Hierarchical timing captured'],
        ],
        tooltipText:
          'Complex nested operation demonstrating hierarchical performance tracking',
      }),
    },
  );

  console.log('\n=== EXTENDED SPAN EXAMPLES COMPLETE ===');
  console.log('Demonstrated:');
  console.log('  • Simple 2-level nesting (validation → DB operations)');
  console.log(
    '  • Complex 3-level nesting (data pipeline with multiple transformations)',
  );
  console.log('  • Mixed synchronous spans with different operation types');
  console.log('  • Hierarchical performance tracking with detailed metadata');
  console.log(
    '  • Real-world business processes (user registration, reporting)',
  );
  console.log('  • Nested spans showing parent-child timing relationships');
  console.log('');
  console.log('Check the generated trace files for hierarchical visualization');
  console.log('Notice how nested spans create timing hierarchies in DevTools');
}

runTest().catch(console.error);
