import { bold, yellow } from 'ansis';
import type { FormattedIcu } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import { describe, expect, it } from 'vitest';
import { ui } from '@code-pushup/utils';
import { logUnsupportedDetails, toAuditDetails } from './details.js';

describe('logUnsupportedDetails', () => {
  it('should log unsupported entries', () => {
    logUnsupportedDetails([
      { details: { type: 'screenshot' } },
    ] as unknown as Result[]);
    expect(ui()).toHaveLoggedTimes(1);
    expect(ui()).toHaveLoggedLevel('debug');
    expect(ui()).toHaveLoggedMessage(
      `${yellow('⚠')} Plugin ${bold(
        'lighthouse',
      )} skipped parsing of unsupported audit details: ${bold('screenshot')}`,
    );
  });

  it('should log only 3 details of unsupported entries', () => {
    logUnsupportedDetails([
      { details: { type: 'table' } },
      { details: { type: 'filmstrip' } },
      { details: { type: 'screenshot' } },
      { details: { type: 'opportunity' } },
      { details: { type: 'debugdata' } },
      { details: { type: 'treemap-data' } },
      { details: { type: 'criticalrequestchain' } },
    ] as unknown as Result[]);
    expect(ui()).toHaveLoggedTimes(1);
    expect(ui()).toHaveLoggedLevel('debug');
    expect(ui()).toHaveLoggedMessage(
      `${yellow('⚠')} Plugin ${bold(
        'lighthouse',
      )} skipped parsing of unsupported audit details: ${bold(
        'filmstrip, screenshot, debugdata',
      )} and 2 more.`,
    );
  });
});

describe('toAuditDetails', () => {
  it('should return undefined for missing details', () => {
    const outputs = toAuditDetails(undefined);
    expect(outputs).toStrictEqual({});
  });

  it('should return undefined for unsupported type', () => {
    const outputs = toAuditDetails({ type: 'debugdata' });
    expect(outputs).toStrictEqual({});
  });

  it('should return undefined for supported type with empty table', () => {
    const outputs = toAuditDetails({
      type: 'table',
      items: [],
    } as unknown as FormattedIcu<Details>);
    expect(outputs).toStrictEqual({});
  });

  it('should render audit details of type table', () => {
    const outputs = toAuditDetails({
      type: 'table',
      headings: [
        {
          key: 'name',
          valueType: 'text',
          label: 'Name',
        },
        {
          key: 'duration',
          valueType: 'ms',
          label: 'Duration',
        },
      ],
      items: [
        {
          name: 'Zone',
          duration: 0.634,
        },
        {
          name: 'Zone:ZoneAwarePromise',
          duration: 0.783,
        },
      ],
    });

    expect(outputs).toStrictEqual({
      table: {
        columns: [
          {
            key: 'name',
            label: 'Name',
            align: 'left',
          },
          {
            key: 'duration',
            label: 'Duration',
            align: 'left',
          },
        ],
        rows: [
          {
            name: 'Zone',
            duration: '0.634 ms',
          },
          {
            name: 'Zone:ZoneAwarePromise',
            duration: '0.783 ms',
          },
        ],
      },
    });
  });

  it('should not render audit details of type table that is empty', () => {
    const outputs = toAuditDetails({
      type: 'table',
      headings: [],
      items: [],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should render audit details of type opportunity', () => {
    const outputs = toAuditDetails({
      type: 'opportunity',
      headings: [
        {
          key: 'node',
          valueType: 'node',
          label: '',
        },
        {
          key: 'url',
          valueType: 'url',
          label: 'URL',
        },
        {
          key: 'totalBytes',
          valueType: 'bytes',
          label: 'Resource Size',
        },
        {
          key: 'wastedBytes',
          valueType: 'bytes',
          label: 'Potential Savings',
        },
      ],
      items: [
        {
          node: {
            type: 'node',
            lhId: '1-12-IMG',
            path: '1,HTML,1,BODY,1,CP-ROOT,2,CP-HOME,1,SECTION,5,DIV,0,CP-WINDOW-FRAME,1,DIV,0,IMG',
            selector:
              'div.feature > cp-window-frame.window > div.body > img.product-screen',
            boundingRect: {
              top: 2343,
              bottom: 2469,
              left: 220,
              right: 399,
              width: 180,
              height: 126,
            },
            snippet:
              '<img _ngcontent-ng-c3822036995="" ngsrc="assets/code-suggestion.webp" alt="Code suggestion" height="1106" width="1572" class="product-screen" loading="lazy" fetchpriority="auto" ng-img="true" src="assets/code-suggestion.webp">',
            nodeLabel: 'Code suggestion',
          },
          url: 'https://codepushup.dev/assets/code-suggestion.webp',
          totalBytes: 78_235,
          wastedBytes: 75_110,
          wastedPercent: 96.005_048_796_985_22,
        },
        {
          node: {
            type: 'node',
            lhId: '1-10-IMG',
            path: '1,HTML,1,BODY,1,CP-ROOT,2,CP-HOME,1,SECTION,3,DIV,0,CP-WINDOW-FRAME,1,DIV,0,IMG',
            selector:
              'div.feature > cp-window-frame.window > div.body > img.product-screen',
            boundingRect: {
              top: 1707,
              bottom: 1889,
              left: 220,
              right: 399,
              width: 180,
              height: 182,
            },
            snippet:
              '<img _ngcontent-ng-c3822036995="" ngsrc="assets/category-detail.webp" alt="Category detail" height="1212" width="1197" class="product-screen" loading="lazy" fetchpriority="auto" ng-img="true" src="assets/category-detail.webp">',
            nodeLabel: 'Category detail',
          },
          url: 'https://codepushup.dev/assets/category-detail.webp',
          totalBytes: 53_596,
          wastedBytes: 49_890,
          wastedPercent: 93.084_505_819_002_96,
        },
      ],
      overallSavingsMs: 1750,
      overallSavingsBytes: 333_817,
      sortedBy: ['wastedBytes'],
      debugData: {
        type: 'debugdata',
        metricSavings: {
          FCP: 0,
          LCP: 290,
        },
      },
    } satisfies Details.Opportunity);

    expect(outputs).toStrictEqual({
      table: {
        title: 'Opportunity',
        columns: [
          {
            key: 'node',
            align: 'left',
          },
          {
            key: 'url',
            label: 'URL',
            align: 'left',
          },
          {
            key: 'totalBytes',
            label: 'Resource Size',
            align: 'left',
          },
          {
            key: 'wastedBytes',
            label: 'Potential Savings',
            align: 'left',
          },
        ],
        rows: [
          {
            node: 'div.feature > cp-window-frame.window > div.body > img.product-screen',
            totalBytes: '76.4 kB',
            url: '<a href="https://codepushup.dev/assets/code-suggestion.webp">https://codepushup.dev/assets/code-suggestion.webp</a>',
            wastedBytes: '73.35 kB',
          },
          {
            node: 'div.feature > cp-window-frame.window > div.body > img.product-screen',
            totalBytes: '52.34 kB',
            url: '<a href="https://codepushup.dev/assets/category-detail.webp">https://codepushup.dev/assets/category-detail.webp</a>',
            wastedBytes: '48.72 kB',
          },
        ],
      },
    });
  });

  it('should not render audit details of type opportunity that is empty', () => {
    const outputs = toAuditDetails({
      type: 'opportunity',
      headings: [],
      items: [],
    } satisfies Details.Opportunity);

    expect(outputs).toStrictEqual({});
  });

  it('should inform that debugdata detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'debugdata',
      items: [
        {
          cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
        },
      ],
    });

    // @TODO add check that cliui.logger is called. Resolve TODO after PR #487 is merged.

    expect(outputs).toStrictEqual({});
  });

  it('should inform that filmstrip detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'filmstrip',
      scale: 3000,
      items: [
        {
          timing: 375,
          timestamp: 106_245_424_545,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwY...',
        },
      ],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that screenshot detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'screenshot',
      timing: 541,
      timestamp: 106_245_590_644,
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that treemap-data detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'treemap-data',
      nodes: [],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that criticalrequestchain detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'criticalrequestchain',
      chains: {
        EED301D300C9A7B634A444E0C6019FC1: {
          request: {
            url: 'https://example.com/',
            startTime: 106_245.050_727,
            endTime: 106_245.559_225,
            responseReceivedTime: 106_245.559_001,
            transferSize: 849,
          },
        },
      },
      longestChain: {
        duration: 508.498_000_010_848_05,
        length: 1,
        transferSize: 849,
      },
    });

    expect(outputs).toStrictEqual({});
  });
});
