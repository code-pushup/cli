export const lhr = {
  lighthouseVersion: '11.1.0',
  requestedUrl: 'https://example.com/',
  mainDocumentUrl: 'https://example.com/',
  finalDisplayedUrl: 'https://example.com/',
  finalUrl: 'https://example.com/',
  fetchTime: '2024-01-15T20:49:26.338Z',
  gatherMode: 'navigation',
  runWarnings: [
    'The tested device appears to have a slower CPU than  Lighthouse expects. This can negatively affect your performance score. Learn more about [calibrating an appropriate CPU slowdown multiplier](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md#cpu-throttling).',
  ],
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  environment: {
    networkUserAgent:
      'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36',
    hostUserAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    benchmarkIndex: 827,
    credits: {},
  },
  audits: {
    'largest-contentful-paint': {
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      description:
        'Largest Contentful Paint marks the time at which the largest text or image is painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)',
      score: 1,
      scoreDisplayMode: 'numeric',
      numericValue: 815,
      numericUnit: 'millisecond',
      displayValue: '0.8 s',
    },
  },
  configSettings: {
    output: ['json'],
    maxWaitForFcp: 30_000,
    maxWaitForLoad: 45_000,
    pauseAfterFcpMs: 1000,
    pauseAfterLoadMs: 1000,
    networkQuietThresholdMs: 1000,
    cpuQuietThresholdMs: 1000,
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.560_000_000_000_2,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
    throttlingMethod: 'simulate',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    emulatedUserAgent:
      'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36',
    auditMode: false,
    gatherMode: false,
    disableStorageReset: false,
    debugNavigation: false,
    channel: 'cli',
    usePassiveGathering: false,
    disableFullPageScreenshot: false,
    skipAboutBlank: false,
    blankPage: 'about:blank',
    budgets: null,
    locale: 'en-US',
    blockedUrlPatterns: null,
    additionalTraceCategories: null,
    extraHeaders: null,
    precomputedLanternData: null,
    onlyAudits: ['largest-contentful-paint'],
    onlyCategories: null,
    skipAudits: null,
  },
  categories: {
    performance: {
      title: 'Performance',
      supportedModes: ['navigation', 'timespan', 'snapshot'],
      auditRefs: [
        {
          id: 'largest-contentful-paint',
          weight: 25,
          group: 'metrics',
          acronym: 'LCP',
          relevantAudits: [
            'server-response-time',
            'render-blocking-resources',
            'redirects',
            'critical-request-chains',
            'uses-text-compression',
            'uses-rel-preconnect',
            'uses-rel-preload',
            'font-display',
            'unminified-javascript',
            'unminified-css',
            'unused-css-rules',
            'largest-contentful-paint-element',
            'prioritize-lcp-image',
            'unused-javascript',
            'efficient-animated-content',
            'total-byte-weight',
            'lcp-lazy-loaded',
          ],
        },
      ],
      id: 'performance',
      score: 1,
    },
  },
  categoryGroups: {
    metrics: {
      title: 'Metrics',
    },
    'load-opportunities': {
      title: 'Opportunities',
      description:
        "These suggestions can help your page load faster. They don't [directly affect](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/) the Performance score.",
    },
    budgets: {
      title: 'Budgets',
      description:
        'Performance budgets set standards for the performance of your site.',
    },
    diagnostics: {
      title: 'Diagnostics',
      description:
        "More information about the performance of your application. These numbers don't [directly affect](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/) the Performance score.",
    },
    'pwa-installable': {
      title: 'Installable',
    },
    'pwa-optimized': {
      title: 'PWA Optimized',
    },
    'a11y-best-practices': {
      title: 'Best practices',
      description: 'These items highlight common accessibility best practices.',
    },
    'a11y-color-contrast': {
      title: 'Contrast',
      description:
        'These are opportunities to improve the legibility of your content.',
    },
    'a11y-names-labels': {
      title: 'Names and labels',
      description:
        'These are opportunities to improve the semantics of the controls in your application. This may enhance the experience for users of assistive technology, like a screen reader.',
    },
    'a11y-navigation': {
      title: 'Navigation',
      description:
        'These are opportunities to improve keyboard navigation in your application.',
    },
    'a11y-aria': {
      title: 'ARIA',
      description:
        'These are opportunities to improve the usage of ARIA in your application which may enhance the experience for users of assistive technology, like a screen reader.',
    },
    'a11y-language': {
      title: 'Internationalization and localization',
      description:
        'These are opportunities to improve the interpretation of your content by users in different locales.',
    },
    'a11y-audio-video': {
      title: 'Audio and video',
      description:
        'These are opportunities to provide alternative content for audio and video. This may improve the experience for users with hearing or vision impairments.',
    },
    'a11y-tables-lists': {
      title: 'Tables and lists',
      description:
        'These are opportunities to improve the experience of reading tabular or list data using assistive technology, like a screen reader.',
    },
    'seo-mobile': {
      title: 'Mobile Friendly',
      description:
        'Make sure your pages are mobile friendly so users don’t have to pinch or zoom in order to read the content pages. [Learn how to make pages mobile-friendly](https://developers.google.com/search/mobile-sites/).',
    },
    'seo-content': {
      title: 'Content Best Practices',
      description:
        'Format your HTML in a way that enables crawlers to better understand your app’s content.',
    },
    'seo-crawl': {
      title: 'Crawling and Indexing',
      description:
        'To appear in search results, crawlers need access to your app.',
    },
    'best-practices-trust-safety': {
      title: 'Trust and Safety',
    },
    'best-practices-ux': {
      title: 'User Experience',
    },
    'best-practices-browser-compat': {
      title: 'Browser Compatibility',
    },
    'best-practices-general': {
      title: 'General',
    },
    hidden: {
      title: '',
    },
  },
  stackPacks: [],
  entities: [
    {
      name: 'example.com',
      origins: ['https://example.com'],
      isFirstParty: true,
      isUnrecognized: true,
    },
  ],
  fullPageScreenshot: {
    screenshot: {
      data: 'data:image/webp;base64,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',
      width: 412,
      height: 823,
    },
    nodes: {},
  },
  timing: {
    entries: [
      {
        startTime: 1294.06,
        name: 'lh:config',
        duration: 307.89,
        entryType: 'measure',
      },
      {
        startTime: 1305.77,
        name: 'lh:config:resolveArtifactsToDefns',
        duration: 138.39,
        entryType: 'measure',
      },
      {
        startTime: 1444.38,
        name: 'lh:config:resolveNavigationsToDefns',
        duration: 0.3,
        entryType: 'measure',
      },
      {
        startTime: 1602.02,
        name: 'lh:runner:gather',
        duration: 7618.56,
        entryType: 'measure',
      },
      {
        startTime: 1706.58,
        name: 'lh:driver:connect',
        duration: 9.36,
        entryType: 'measure',
      },
      {
        startTime: 1716.15,
        name: 'lh:driver:navigate',
        duration: 123.63,
        entryType: 'measure',
      },
      {
        startTime: 1839.89,
        name: 'lh:gather:getBenchmarkIndex',
        duration: 1030.19,
        entryType: 'measure',
      },
      {
        startTime: 2870.2,
        name: 'lh:gather:getVersion',
        duration: 0.84,
        entryType: 'measure',
      },
      {
        startTime: 2871.12,
        name: 'lh:prepare:navigationMode',
        duration: 15.99,
        entryType: 'measure',
      },
      {
        startTime: 2887.34,
        name: 'lh:driver:navigate',
        duration: 45.1,
        entryType: 'measure',
      },
      {
        startTime: 2932.61,
        name: 'lh:prepare:navigation',
        duration: 233.82,
        entryType: 'measure',
      },
      {
        startTime: 2954.3,
        name: 'lh:storage:clearDataForOrigin',
        duration: 3.77,
        entryType: 'measure',
      },
      {
        startTime: 2958.21,
        name: 'lh:storage:clearBrowserCaches',
        duration: 206.63,
        entryType: 'measure',
      },
      {
        startTime: 3164.97,
        name: 'lh:gather:prepareThrottlingAndNetwork',
        duration: 1.45,
        entryType: 'measure',
      },
      {
        startTime: 3230.89,
        name: 'lh:driver:navigate',
        duration: 4309.89,
        entryType: 'measure',
      },
      {
        startTime: 8142.67,
        name: 'lh:gather:getArtifact:DevtoolsLog',
        duration: 0.05,
        entryType: 'measure',
      },
      {
        startTime: 8142.74,
        name: 'lh:gather:getArtifact:Trace',
        duration: 0.02,
        entryType: 'measure',
      },
      {
        startTime: 8142.82,
        name: 'lh:computed:NetworkRecords',
        duration: 0.23,
        entryType: 'measure',
      },
      {
        startTime: 8143.18,
        name: 'lh:gather:getArtifact:DevtoolsLog',
        duration: 0.02,
        entryType: 'measure',
      },
      {
        startTime: 8143.2,
        name: 'lh:gather:getArtifact:Trace',
        duration: 0.01,
        entryType: 'measure',
      },
      {
        startTime: 8143.25,
        name: 'lh:gather:getArtifact:NetworkUserAgent',
        duration: 0.03,
        entryType: 'measure',
      },
      {
        startTime: 8143.28,
        name: 'lh:gather:getArtifact:Stacks',
        duration: 7.33,
        entryType: 'measure',
      },
      {
        startTime: 8143.32,
        name: 'lh:gather:collectStacks',
        duration: 7.28,
        entryType: 'measure',
      },
      {
        startTime: 8150.63,
        name: 'lh:gather:getArtifact:devtoolsLogs',
        duration: 0.06,
        entryType: 'measure',
      },
      {
        startTime: 8150.7,
        name: 'lh:gather:getArtifact:traces',
        duration: 0.02,
        entryType: 'measure',
      },
      {
        startTime: 8150.73,
        name: 'lh:gather:getArtifact:FullPageScreenshot',
        duration: 1062.88,
        entryType: 'measure',
      },
      {
        startTime: 9221.12,
        name: 'lh:runner:audit',
        duration: 34.82,
        entryType: 'measure',
      },
      {
        startTime: 9221.18,
        name: 'lh:runner:auditing',
        duration: 34.35,
        entryType: 'measure',
      },
      {
        startTime: 9223.11,
        name: 'lh:audit:largest-contentful-paint',
        duration: 32.35,
        entryType: 'measure',
      },
      {
        startTime: 9223.64,
        name: 'lh:computed:LargestContentfulPaint',
        duration: 31.23,
        entryType: 'measure',
      },
      {
        startTime: 9223.76,
        name: 'lh:computed:ProcessedTrace',
        duration: 26.13,
        entryType: 'measure',
      },
      {
        startTime: 9249.91,
        name: 'lh:computed:ProcessedNavigation',
        duration: 0.34,
        entryType: 'measure',
      },
      {
        startTime: 9250.32,
        name: 'lh:computed:LanternLargestContentfulPaint',
        duration: 4.54,
        entryType: 'measure',
      },
      {
        startTime: 9250.34,
        name: 'lh:computed:LanternFirstContentfulPaint',
        duration: 3.6,
        entryType: 'measure',
      },
      {
        startTime: 9250.41,
        name: 'lh:computed:PageDependencyGraph',
        duration: 1.18,
        entryType: 'measure',
      },
      {
        startTime: 9251.6,
        name: 'lh:computed:LoadSimulator',
        duration: 0.64,
        entryType: 'measure',
      },
      {
        startTime: 9251.65,
        name: 'lh:computed:NetworkAnalysis',
        duration: 0.44,
        entryType: 'measure',
      },
      {
        startTime: 9255.54,
        name: 'lh:runner:generate',
        duration: 0.39,
        entryType: 'measure',
      },
      {
        startTime: 9256.32,
        name: 'lh:computed:EntityClassification',
        duration: 0.22,
        entryType: 'measure',
      },
    ],
    total: 7653.38,
  },
  i18n: {
    rendererFormattedStrings: {
      calculatorLink: 'See calculator.',
      collapseView: 'Collapse view',
      crcInitialNavigation: 'Initial Navigation',
      crcLongestDurationLabel: 'Maximum critical path latency:',
      dropdownCopyJSON: 'Copy JSON',
      dropdownDarkTheme: 'Toggle Dark Theme',
      dropdownPrintExpanded: 'Print Expanded',
      dropdownPrintSummary: 'Print Summary',
      dropdownSaveGist: 'Save as Gist',
      dropdownSaveHTML: 'Save as HTML',
      dropdownSaveJSON: 'Save as JSON',
      dropdownViewer: 'Open in Viewer',
      dropdownViewUnthrottledTrace: 'View Unthrottled Trace',
      errorLabel: 'Error!',
      errorMissingAuditInfo: 'Report error: no audit information',
      expandView: 'Expand view',
      firstPartyChipLabel: '1st party',
      footerIssue: 'File an issue',
      hide: 'Hide',
      labDataTitle: 'Lab Data',
      lsPerformanceCategoryDescription:
        '[Lighthouse](https://developers.google.com/web/tools/lighthouse/) analysis of the current page on an emulated mobile network. Values are estimated and may vary.',
      manualAuditsGroupTitle: 'Additional items to manually check',
      notApplicableAuditsGroupTitle: 'Not applicable',
      openInANewTabTooltip: 'Open in a new tab',
      opportunityResourceColumnLabel: 'Opportunity',
      opportunitySavingsColumnLabel: 'Estimated Savings',
      passedAuditsGroupTitle: 'Passed audits',
      runtimeAnalysisWindow: 'Initial page load',
      runtimeCustom: 'Custom throttling',
      runtimeDesktopEmulation: 'Emulated Desktop',
      runtimeMobileEmulation: 'Emulated Moto G Power',
      runtimeNoEmulation: 'No emulation',
      runtimeSettingsAxeVersion: 'Axe version',
      runtimeSettingsBenchmark: 'Unthrottled CPU/Memory Power',
      runtimeSettingsCPUThrottling: 'CPU throttling',
      runtimeSettingsDevice: 'Device',
      runtimeSettingsNetworkThrottling: 'Network throttling',
      runtimeSettingsScreenEmulation: 'Screen emulation',
      runtimeSettingsUANetwork: 'User agent (network)',
      runtimeSingleLoad: 'Single page load',
      runtimeSingleLoadTooltip:
        'This data is taken from a single page load, as opposed to field data summarizing many sessions.',
      runtimeSlow4g: 'Slow 4G throttling',
      runtimeUnknown: 'Unknown',
      show: 'Show',
      showRelevantAudits: 'Show audits relevant to:',
      snippetCollapseButtonLabel: 'Collapse snippet',
      snippetExpandButtonLabel: 'Expand snippet',
      thirdPartyResourcesLabel: 'Show 3rd-party resources',
      throttlingProvided: 'Provided by environment',
      toplevelWarningsMessage:
        'There were issues affecting this run of Lighthouse:',
      unattributable: 'Unattributable',
      varianceDisclaimer:
        'Values are estimated and may vary. The [performance score is calculated](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/) directly from these metrics.',
      viewTraceLabel: 'View Trace',
      viewTreemapLabel: 'View Treemap',
      warningAuditsGroupTitle: 'Passed audits but with warnings',
      warningHeader: 'Warnings: ',
    },
    icuMessagePaths: {
      'core/gather/driver/environment.js | warningSlowHostCpu': [
        'runWarnings[0]',
      ],
      'core/lib/i18n/i18n.js | largestContentfulPaintMetric': [
        'audits[largest-contentful-paint].title',
      ],
      'core/audits/metrics/largest-contentful-paint.js | description': [
        'audits[largest-contentful-paint].description',
      ],
      'core/lib/i18n/i18n.js | seconds': [
        {
          values: {
            timeInMs: 815,
          },
          path: 'audits[largest-contentful-paint].displayValue',
        },
      ],
      'core/config/default-config.js | performanceCategoryTitle': [
        'categories.performance.title',
      ],
      'core/config/default-config.js | metricGroupTitle': [
        'categoryGroups.metrics.title',
      ],
      'core/config/default-config.js | loadOpportunitiesGroupTitle': [
        'categoryGroups[load-opportunities].title',
      ],
      'core/config/default-config.js | loadOpportunitiesGroupDescription': [
        'categoryGroups[load-opportunities].description',
      ],
      'core/config/default-config.js | budgetsGroupTitle': [
        'categoryGroups.budgets.title',
      ],
      'core/config/default-config.js | budgetsGroupDescription': [
        'categoryGroups.budgets.description',
      ],
      'core/config/default-config.js | diagnosticsGroupTitle': [
        'categoryGroups.diagnostics.title',
      ],
      'core/config/default-config.js | diagnosticsGroupDescription': [
        'categoryGroups.diagnostics.description',
      ],
      'core/config/default-config.js | pwaInstallableGroupTitle': [
        'categoryGroups[pwa-installable].title',
      ],
      'core/config/default-config.js | pwaOptimizedGroupTitle': [
        'categoryGroups[pwa-optimized].title',
      ],
      'core/config/default-config.js | a11yBestPracticesGroupTitle': [
        'categoryGroups[a11y-best-practices].title',
      ],
      'core/config/default-config.js | a11yBestPracticesGroupDescription': [
        'categoryGroups[a11y-best-practices].description',
      ],
      'core/config/default-config.js | a11yColorContrastGroupTitle': [
        'categoryGroups[a11y-color-contrast].title',
      ],
      'core/config/default-config.js | a11yColorContrastGroupDescription': [
        'categoryGroups[a11y-color-contrast].description',
      ],
      'core/config/default-config.js | a11yNamesLabelsGroupTitle': [
        'categoryGroups[a11y-names-labels].title',
      ],
      'core/config/default-config.js | a11yNamesLabelsGroupDescription': [
        'categoryGroups[a11y-names-labels].description',
      ],
      'core/config/default-config.js | a11yNavigationGroupTitle': [
        'categoryGroups[a11y-navigation].title',
      ],
      'core/config/default-config.js | a11yNavigationGroupDescription': [
        'categoryGroups[a11y-navigation].description',
      ],
      'core/config/default-config.js | a11yAriaGroupTitle': [
        'categoryGroups[a11y-aria].title',
      ],
      'core/config/default-config.js | a11yAriaGroupDescription': [
        'categoryGroups[a11y-aria].description',
      ],
      'core/config/default-config.js | a11yLanguageGroupTitle': [
        'categoryGroups[a11y-language].title',
      ],
      'core/config/default-config.js | a11yLanguageGroupDescription': [
        'categoryGroups[a11y-language].description',
      ],
      'core/config/default-config.js | a11yAudioVideoGroupTitle': [
        'categoryGroups[a11y-audio-video].title',
      ],
      'core/config/default-config.js | a11yAudioVideoGroupDescription': [
        'categoryGroups[a11y-audio-video].description',
      ],
      'core/config/default-config.js | a11yTablesListsVideoGroupTitle': [
        'categoryGroups[a11y-tables-lists].title',
      ],
      'core/config/default-config.js | a11yTablesListsVideoGroupDescription': [
        'categoryGroups[a11y-tables-lists].description',
      ],
      'core/config/default-config.js | seoMobileGroupTitle': [
        'categoryGroups[seo-mobile].title',
      ],
      'core/config/default-config.js | seoMobileGroupDescription': [
        'categoryGroups[seo-mobile].description',
      ],
      'core/config/default-config.js | seoContentGroupTitle': [
        'categoryGroups[seo-content].title',
      ],
      'core/config/default-config.js | seoContentGroupDescription': [
        'categoryGroups[seo-content].description',
      ],
      'core/config/default-config.js | seoCrawlingGroupTitle': [
        'categoryGroups[seo-crawl].title',
      ],
      'core/config/default-config.js | seoCrawlingGroupDescription': [
        'categoryGroups[seo-crawl].description',
      ],
      'core/config/default-config.js | bestPracticesTrustSafetyGroupTitle': [
        'categoryGroups[best-practices-trust-safety].title',
      ],
      'core/config/default-config.js | bestPracticesUXGroupTitle': [
        'categoryGroups[best-practices-ux].title',
      ],
      'core/config/default-config.js | bestPracticesBrowserCompatGroupTitle': [
        'categoryGroups[best-practices-browser-compat].title',
      ],
      'core/config/default-config.js | bestPracticesGeneralGroupTitle': [
        'categoryGroups[best-practices-general].title',
      ],
    },
  },
};
