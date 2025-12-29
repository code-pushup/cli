import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../src/index.js';

/**
 * Extended span-async examples with nested async spans and complex hierarchies
 * Demonstrates asynchronous span nesting and hierarchical performance tracking
 */
async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'span-async-extended',
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
      external: {
        track: 'External Services',
        group: 'Third Party',
        color: 'tertiary-light',
      },
    } as const,
  });

  console.log('=== EXTENDED SPAN-ASYNC EXAMPLES ===\n');

  // Example 1: Nested async spans with API orchestration
  console.log('1. Nested async spans with API orchestration');
  await profiler.spanAsync(
    'process-payment-order',
    async () => {
      console.log('   Processing payment order...');

      // Nested async span for payment validation
      await profiler.spanAsync(
        'validate-payment-details',
        async () => {
          console.log('     Validating payment information...');
          await sleep(50);

          // Double-nested async span for fraud check
          await profiler.spanAsync(
            'fraud-detection-check',
            async () => {
              console.log('       Running fraud detection...');
              await sleep(80);

              // Triple-nested async span for external service call
              await profiler.spanAsync(
                'call-fraud-api',
                async () => {
                  console.log(
                    '         Calling external fraud detection API...',
                  );
                  await sleep(120);
                  return { fraudScore: 15, riskLevel: 'low', checksPassed: 8 };
                },
                {
                  detail: profiler.spans.external({
                    properties: [
                      ['Service', 'FraudDetection API v2.1'],
                      ['Endpoint', 'POST /api/v2/fraud/analyze'],
                      ['Request Size', '1.8 KB'],
                      ['Response Time', '120ms'],
                      ['Fraud Score', '15/100'],
                      ['Risk Assessment', 'Low'],
                      ['Checks Performed', '8'],
                    ],
                    tooltipText: 'External fraud detection service call',
                  }),
                },
              );

              return { fraudCheckPassed: true, riskScore: 15 };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Algorithm', 'Machine Learning Model v3.2'],
                  ['Features Analyzed', '12'],
                  ['Confidence Score', '94%'],
                  ['Processing Time', '80ms'],
                  ['Risk Threshold', '30/100'],
                ],
                tooltipText: 'Internal fraud detection processing',
              }),
            },
          );

          return { validationPassed: true, fraudScore: 15 };
        },
        {
          detail: profiler.spans.processing({
            properties: [
              ['Payment Method', 'Credit Card'],
              ['Amount', '$149.99'],
              ['Currency', 'USD'],
              ['Validation Rules', '15 applied'],
              ['Security Checks', '8 passed'],
              ['Fraud Score', '15/100 (Low Risk)'],
            ],
            tooltipText:
              'Complete payment validation including fraud detection',
          }),
        },
      );

      // Nested async span for payment processing
      await profiler.spanAsync(
        'process-payment-charge',
        async () => {
          console.log('     Processing payment charge...');
          await sleep(30);

          // Double-nested async span for payment gateway call
          await profiler.spanAsync(
            'stripe-payment-api',
            async () => {
              console.log('       Calling Stripe payment API...');
              await sleep(200);

              // Triple-nested async span for 3DS authentication
              await profiler.spanAsync(
                '3ds-authentication',
                async () => {
                  console.log('         Performing 3DS authentication...');
                  await sleep(150);
                  return { authenticated: true, liabilityShift: true };
                },
                {
                  detail: profiler.spans.external({
                    properties: [
                      ['3DS Version', '2.1'],
                      ['Authentication Method', 'Challenge'],
                      ['Liability Shift', '✓ Achieved'],
                      ['Processing Time', '150ms'],
                      ['User Experience', 'Frictionless'],
                      ['Security Level', 'High'],
                    ],
                    tooltipText:
                      '3D Secure authentication with liability shift',
                  }),
                },
              );

              return {
                chargeId: 'ch_abc123def456',
                amount: 14999,
                currency: 'usd',
                status: 'succeeded',
              };
            },
            {
              detail: profiler.spans.external({
                properties: [
                  ['Provider', 'Stripe API v2024-01'],
                  ['Endpoint', 'POST /v1/charges'],
                  ['Request Size', '2.1 KB'],
                  ['Response Time', '200ms'],
                  ['Processing Fee', '$0.59'],
                  ['Net Amount', '$149.40'],
                  ['Charge Status', 'Succeeded'],
                ],
                tooltipText: 'Stripe payment processing API call',
              }),
            },
          );

          return { paymentProcessed: true, chargeId: 'ch_abc123def456' };
        },
        {
          detail: profiler.spans.api({
            properties: [
              ['Payment Processor', 'Stripe'],
              ['Amount', '$149.99'],
              ['Currency', 'USD'],
              ['Processing Time', '350ms'],
              ['3DS Authentication', '✓ Completed'],
              ['Charge Status', 'Succeeded'],
              ['Transaction Fee', '$0.59'],
            ],
            tooltipText: 'Complete payment processing with external provider',
          }),
        },
      );

      // Nested async span for order fulfillment
      await profiler.spanAsync(
        'fulfill-order',
        async () => {
          console.log('     Fulfilling order...');

          // Double-nested async span for inventory check
          await profiler.spanAsync(
            'check-inventory',
            async () => {
              console.log('       Checking product inventory...');
              await sleep(40);

              // Triple-nested async span for database query
              await profiler.spanAsync(
                'inventory-db-query',
                async () => {
                  console.log('         Querying inventory database...');
                  await sleep(25);
                  return { inStock: true, quantity: 45, reserved: 1 };
                },
                {
                  detail: profiler.spans.db({
                    properties: [
                      ['Table', 'product_inventory'],
                      ['Query Type', 'SELECT FOR UPDATE'],
                      ['Lock Acquired', 'Row-level'],
                      ['Execution Time', '25ms'],
                      ['Rows Examined', '1'],
                    ],
                    tooltipText: 'Inventory database query with row locking',
                  }),
                },
              );

              return { inventoryAvailable: true, quantity: 45 };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Product SKU', 'TECH-2024-WIDGET'],
                  ['Requested Quantity', '1'],
                  ['Available Stock', '45 units'],
                  ['Reorder Point', '10 units'],
                  ['Lead Time', '2 days'],
                ],
                tooltipText: 'Inventory availability check with stock levels',
              }),
            },
          );

          // Double-nested async span for shipping calculation
          await profiler.spanAsync(
            'calculate-shipping',
            async () => {
              console.log('       Calculating shipping costs...');
              await sleep(60);

              // Triple-nested async span for shipping API
              await profiler.spanAsync(
                'shipping-rate-api',
                async () => {
                  console.log('         Calling shipping rate API...');
                  await sleep(100);
                  return {
                    carrier: 'UPS',
                    service: 'Ground',
                    cost: 8.99,
                    deliveryDays: 3,
                  };
                },
                {
                  detail: profiler.spans.external({
                    properties: [
                      ['Carrier', 'UPS'],
                      ['Service', 'Ground'],
                      ['Rate Calculation', 'Real-time'],
                      ['Response Time', '100ms'],
                      ['Shipping Cost', '$8.99'],
                      ['Delivery Estimate', '3 business days'],
                    ],
                    tooltipText: 'External shipping rate calculation API',
                  }),
                },
              );

              return { shippingCost: 8.99, deliveryEstimate: '3 days' };
            },
            {
              detail: profiler.spans.api({
                properties: [
                  ['Shipping Method', 'UPS Ground'],
                  ['Cost', '$8.99'],
                  ['Tax Amount', '$0.71'],
                  ['Total Shipping', '$9.70'],
                  ['Delivery Days', '3'],
                  ['Tracking', 'Included'],
                ],
                tooltipText: 'Shipping calculation with carrier integration',
              }),
            },
          );

          return {
            orderFulfilled: true,
            inventoryReserved: true,
            shippingCalculated: true,
            totalCost: 159.69,
          };
        },
        {
          detail: profiler.spans.processing({
            properties: [
              ['Order Items', '1'],
              ['Inventory Status', 'Reserved'],
              ['Shipping Method', 'UPS Ground'],
              ['Shipping Cost', '$8.99'],
              ['Tax Amount', '$0.71'],
              ['Order Total', '$159.69'],
              ['Fulfillment Time', '200ms'],
            ],
            tooltipText: 'Complete order fulfillment process',
          }),
        },
      );

      return {
        success: true,
        orderId: 'ORD-2024-001',
        paymentProcessed: true,
        orderFulfilled: true,
        totalAmount: 159.69,
      };
    },
    {
      detail: profiler.spans.main({
        properties: [
          ['Operation', 'Complete Payment & Order Processing'],
          ['Order ID', 'ORD-2024-001'],
          ['Payment Amount', '$149.99'],
          ['Shipping Cost', '$9.70'],
          ['Total Amount', '$159.69'],
          ['Processing Steps', 'Validation → Payment → Fulfillment'],
          ['Nested Spans', '8 async operations'],
          ['External Services', '3 APIs called'],
          ['Processing Time', 'Hierarchical async timing'],
        ],
        tooltipText:
          'End-to-end payment processing with nested async operations and external service calls',
      }),
    },
  );

  await sleep(300);

  // Example 2: Complex async workflow with parallel and sequential operations
  console.log(
    '2. Complex async workflow with parallel and sequential operations',
  );
  await profiler.spanAsync(
    'process-user-onboarding',
    async () => {
      console.log('   Starting user onboarding workflow...');

      // Sequential phase 1: Account setup
      await profiler.spanAsync(
        'setup-user-account',
        async () => {
          console.log('     Setting up user account...');

          // Parallel operations within account setup
          const [profileResult, preferencesResult] = await Promise.all([
            profiler.spanAsync(
              'create-user-profile',
              async () => {
                console.log('       Creating user profile...');
                await sleep(80);
                return { profileId: 'prof-123', fields: 15 };
              },
              {
                detail: profiler.spans.db({
                  properties: [
                    ['Table', 'user_profiles'],
                    ['Operation', 'INSERT'],
                    ['Fields Populated', '15'],
                    ['Default Values', '8'],
                    ['Validation', 'Passed'],
                  ],
                  tooltipText: 'User profile creation in database',
                }),
              },
            ),

            profiler.spanAsync(
              'initialize-user-preferences',
              async () => {
                console.log('       Initializing user preferences...');
                await sleep(60);
                return { preferencesSet: true, categories: 12 };
              },
              {
                detail: profiler.spans.processing({
                  properties: [
                    ['Preferences Categories', '12'],
                    ['Default Values Applied', '47 settings'],
                    ['Customization Options', 'Enabled'],
                    ['Privacy Settings', 'Initialized'],
                  ],
                  tooltipText: 'User preferences initialization with defaults',
                }),
              },
            ),
          ]);

          return {
            accountSetup: true,
            profileCreated: profileResult.profileId,
            preferencesInitialized: preferencesResult.preferencesSet,
          };
        },
        {
          detail: profiler.spans.db({
            properties: [
              ['Transaction Type', 'User Account Creation'],
              ['Tables Modified', 'users, user_profiles, user_preferences'],
              ['Parallel Operations', '2'],
              ['Execution Time', '80ms (longest)'],
              ['Consistency', 'ACID compliant'],
            ],
            tooltipText: 'Parallel account setup operations',
          }),
        },
      );

      // Sequential phase 2: Email verification
      await profiler.spanAsync(
        'send-verification-email',
        async () => {
          console.log('     Sending email verification...');

          await profiler.spanAsync(
            'generate-verification-token',
            async () => {
              console.log('       Generating secure verification token...');
              await sleep(40);

              await profiler.spanAsync(
                'encrypt-token',
                async () => {
                  console.log('         Encrypting token with AES-256...');
                  await sleep(25);
                  return { encrypted: true, algorithm: 'AES-256-GCM' };
                },
                {
                  detail: profiler.spans.processing({
                    properties: [
                      ['Algorithm', 'AES-256-GCM'],
                      ['Key Size', '256 bits'],
                      ['Initialization Vector', 'Generated'],
                      ['Integrity', 'HMAC-SHA256'],
                      ['Encryption Time', '25ms'],
                    ],
                    tooltipText: 'Secure token encryption for verification',
                  }),
                },
              );

              return { token: 'abc123securetoken', expires: '24h' };
            },
            {
              detail: profiler.spans.processing({
                properties: [
                  ['Token Length', '32 bytes'],
                  ['Entropy', 'High'],
                  ['Expiration', '24 hours'],
                  ['Algorithm', 'Cryptographically secure random'],
                ],
                tooltipText: 'Verification token generation with encryption',
              }),
            },
          );

          await profiler.spanAsync(
            'deliver-verification-email',
            async () => {
              console.log('       Delivering verification email...');
              await sleep(120);

              await profiler.spanAsync(
                'render-email-template',
                async () => {
                  console.log('         Rendering email template...');
                  await sleep(35);
                  return { rendered: true, template: 'email-verification' };
                },
                {
                  detail: profiler.spans.processing({
                    properties: [
                      ['Template Engine', 'Handlebars'],
                      ['Variables Interpolated', '12'],
                      ['Content Length', '1.8 KB'],
                      ['Responsive Design', '✓ Mobile-friendly'],
                    ],
                    tooltipText:
                      'Email template rendering with personalization',
                  }),
                },
              );

              return { emailSent: true, deliveryId: 'del-456' };
            },
            {
              detail: profiler.spans.api({
                properties: [
                  ['SMTP Server', 'smtp.securemail.com'],
                  ['TLS Version', '1.3'],
                  ['Authentication', 'OAuth2'],
                  ['Delivery Time', '120ms'],
                  ['Bounce Protection', 'Enabled'],
                  ['Open Tracking', 'Included'],
                ],
                tooltipText: 'Secure email delivery with tracking',
              }),
            },
          );

          return { verificationSent: true, tokenExpires: '24h' };
        },
        {
          detail: profiler.spans.api({
            properties: [
              ['Email Type', 'Verification'],
              ['Security Token', 'AES-256 encrypted'],
              ['Expiration', '24 hours'],
              ['Delivery Method', 'SMTP + TLS 1.3'],
              ['Tracking Enabled', '✓ Open/Click tracking'],
            ],
            tooltipText: 'Complete email verification workflow',
          }),
        },
      );

      // Sequential phase 3: Welcome and setup
      await profiler.spanAsync(
        'setup-welcome-experience',
        async () => {
          console.log('     Setting up welcome experience...');

          // Parallel finalization tasks
          const [tutorialResult, analyticsResult] = await Promise.all([
            profiler.spanAsync(
              'initialize-product-tutorial',
              async () => {
                console.log('       Initializing product tutorial...');
                await sleep(90);
                return { tutorialReady: true, steps: 8 };
              },
              {
                detail: profiler.spans.processing({
                  properties: [
                    ['Tutorial Steps', '8'],
                    ['User Progress Tracking', 'Enabled'],
                    ['Completion Rate Target', '75%'],
                    ['Adaptive Content', '✓ Personalized'],
                    ['Analytics Integration', '✓ Enabled'],
                  ],
                  tooltipText: 'Interactive product tutorial initialization',
                }),
              },
            ),

            profiler.spanAsync(
              'setup-analytics-tracking',
              async () => {
                console.log('       Setting up analytics tracking...');
                await sleep(55);

                await profiler.spanAsync(
                  'configure-tracking-pixel',
                  async () => {
                    console.log('         Configuring tracking pixel...');
                    await sleep(20);
                    return { pixelConfigured: true, events: 15 };
                  },
                  {
                    detail: profiler.spans.api({
                      properties: [
                        ['Tracking Events', '15 configured'],
                        ['Privacy Compliant', '✓ GDPR/CCPA'],
                        ['Cookie Consent', 'Required'],
                        ['Data Retention', '26 months'],
                        ['Anonymization', 'Applied'],
                      ],
                      tooltipText:
                        'Privacy-compliant analytics pixel configuration',
                    }),
                  },
                );

                return { analyticsReady: true, trackingEnabled: true };
              },
              {
                detail: profiler.spans.external({
                  properties: [
                    ['Analytics Provider', 'Google Analytics 4'],
                    ['Tracking ID', 'GA4-XXXXXXXXX'],
                    ['Events Configured', '15'],
                    ['Custom Dimensions', '8'],
                    ['Real-time Updates', 'Enabled'],
                  ],
                  tooltipText: 'Analytics tracking setup with custom events',
                }),
              },
            ),
          ]);

          return {
            onboardingComplete: true,
            tutorialReady: tutorialResult.tutorialReady,
            analyticsEnabled: analyticsResult.analyticsReady,
          };
        },
        {
          detail: profiler.spans.processing({
            properties: [
              ['Welcome Experience', 'Tutorial + Analytics'],
              ['Parallel Setup Tasks', '2'],
              ['User Personalization', 'Applied'],
              ['Performance Optimization', 'CDN-enabled'],
              ['Mobile Responsive', '✓ All devices'],
            ],
            tooltipText: 'Welcome experience setup with parallel operations',
          }),
        },
      );

      return {
        success: true,
        userId: 'user-789',
        accountCreated: true,
        verificationSent: true,
        welcomeSetup: true,
        onboardingComplete: true,
      };
    },
    {
      detail: profiler.spans.main({
        properties: [
          ['Operation', 'Complete User Onboarding Workflow'],
          ['Workflow Type', 'Sequential + Parallel Processing'],
          ['Total Steps', '8 nested async operations'],
          ['External Services', 'Email + Analytics'],
          ['Parallel Operations', '4 concurrent tasks'],
          ['Security Features', 'Token encryption, GDPR compliance'],
          ['User Experience', 'Seamless onboarding flow'],
        ],
        tooltipText:
          'Complex async workflow with nested operations, parallel processing, and external service integration',
      }),
    },
  );

  console.log('\n=== EXTENDED SPAN-ASYNC EXAMPLES COMPLETE ===');
  console.log('Demonstrated:');
  console.log('  • Nested async spans (up to 3 levels deep)');
  console.log('  • Sequential and parallel operation patterns');
  console.log('  • External service integration with proper timing');
  console.log('  • Complex business workflows (payments, onboarding)');
  console.log('  • Real-world async processing with multiple dependencies');
  console.log('  • Hierarchical performance tracking in async contexts');
  console.log('');
  console.log(
    'Check the generated trace files for async hierarchical visualization',
  );
  console.log(
    'Notice how nested async spans show concurrent and sequential timing patterns',
  );
}

runTest().catch(console.error);
