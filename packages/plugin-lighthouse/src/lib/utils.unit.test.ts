import Details from 'lighthouse/types/lhr/audit-details';
import { describe, expect, it } from 'vitest';
import { Issue } from '@code-pushup/models';
import {
  AuditsNotImplementedError,
  getLighthouseCliArguments,
  opportunityToDetails,
  tableToDetails,
  toAuditOutputs,
  validateOnlyAudits,
} from './utils';

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(
      getLighthouseCliArguments({
        url: ['https://code-pushup-portal.com'],
      }),
    ).toEqual(expect.arrayContaining(['https://code-pushup-portal.com']));
  });

  it('should parse chrome-flags options correctly', () => {
    const args = getLighthouseCliArguments({
      url: ['https://code-pushup-portal.com'],
      chromeFlags: { headless: 'new', 'user-data-dir': 'test' },
    });
    expect(args).toEqual(
      expect.arrayContaining([
        '--chromeFlags="--headless=new --user-data-dir=test"',
      ]),
    );
  });
});

describe('validateOnlyAudits', () => {
  it('should not throw for audit slugs existing in given audits', () => {
    expect(
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'a',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyAudits do not exist', () => {
    expect(() =>
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'd',
      ),
    ).toThrow(new AuditsNotImplementedError(['d']));
  });
});

describe('toAuditOutputs', () => {
  it('should parse valid lhr details', () => {
    expect(
      toAuditOutputs([
        {
          id: 'first-contentful-paint',
          title: 'First Contentful Paint',
          description:
            'First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).',
          score: 0.55,
          scoreDisplayMode: 'numeric',
          numericValue: 2838.974,
          numericUnit: 'millisecond',
          displayValue: '2.8 s',
        },
      ]),
    ).toStrictEqual([
      {
        displayValue: '2.8 s',
        score: 0.55,
        slug: 'first-contentful-paint',
        value: 2838.974,
      },
    ]);
  });

  it('should parse lhr audits with score null to score 1', () => {
    expect(
      toAuditOutputs([
        {
          id: 'performance-budget',
          title: 'Performance budget',
          description:
            'Keep the quantity and size of network requests under the targets set by the provided performance budget. [Learn more about performance budgets](https://developers.google.com/web/tools/lighthouse/audits/budgets).',
          score: null,
          scoreDisplayMode: 'notApplicable',
        },
      ]),
    ).toStrictEqual(
      expect.arrayContaining([expect.objectContaining({ score: 1 })]),
    );
  });

  it('should inform that debugdata type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        description:
          'Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more about the Cumulative Layout Shift metric](https://web.dev/cls/).',
        score: 1,
        scoreDisplayMode: 'numeric',
        numericValue: 0.000_350_978_852_728_593_95,
        numericUnit: 'unitless',
        displayValue: '0',
        details: {
          type: 'debugdata',
          items: [
            {
              cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
            },
          ],
        },
      },
    ]);
    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that filmstrip type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'screenshot-thumbnails',
        title: 'Screenshot Thumbnails',
        description: 'This is what the load of your site looked like.',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'filmstrip',
          scale: 3000,
          items: [
            {
              timing: 375,
              timestamp: 106_245_424_545,
              data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwY...',
            },
          ],
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that screenshot type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'final-screenshot',
        title: 'Final Screenshot',
        description: 'The last screenshot captured of the pageload.',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'screenshot',
          timing: 541,
          timestamp: 106_245_590_644,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that treemap-data type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'script-treemap-data',
        title: 'Script Treemap Data',
        description: 'Used for treemap app',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'treemap-data',
          nodes: [],
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that criticalrequestchain type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'critical-request-chains',
        title: 'Avoid chaining critical requests',
        description:
          'The Critical Request Chains below show you what resources are loaded with a high priority. Consider reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. [Learn how to avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/).',
        score: null,
        scoreDisplayMode: 'notApplicable',
        displayValue: '',
        details: {
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
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });
});

describe('tableToDetails', () => {
  it('should parse empty lhr details table', () => {
    expect(
      tableToDetails({
        type: 'table',
        headings: [],
        items: [],
      } satisfies Details.Table),
    ).toStrictEqual({
      issues: [
        {
          message: 'no data present',
          severity: 'info',
        } satisfies Issue,
      ],
    });
  });

  it('should parse lhr details table with data', () => {
    expect(
      tableToDetails({
        type: 'table',
        headings: [
          {
            key: 'sourceLocation',
            valueType: 'source-location',
            label: 'Source',
          },
          {
            key: 'description',
            valueType: 'code',
            label: 'Description',
          },
        ],
        items: [
          {
            source: 'network',
            description:
              'Failed to load resource: the server responded with a status of 404 ()',
            sourceLocation: {
              type: 'source-location',
              url: 'https://example.com/favicon.ico',
              urlProvider: 'network',
              line: 0,
              column: 0,
            },
          },
        ],
      } satisfies Details.Table),
    ).toStrictEqual({
      issues: [
        {
          message: 'sourceLocation, description',
          severity: 'info',
        } satisfies Issue,
      ],
    });
  });
});

describe('opportunityToDetails', () => {
  it('should parse a valid non-empty lhr opportunity type', () => {
    expect(
      opportunityToDetails({
        type: 'opportunity',
        headings: [
          {
            key: 'url',
            valueType: 'url',
            label: 'URL',
          },
          {
            key: 'responseTime',
            valueType: 'timespanMs',
            label: 'Time Spent',
          },
        ],
        items: [
          {
            url: 'https://staging.code-pushup.dev/login',
            responseTime: 449.292_000_000_000_03,
          },
        ],
        overallSavingsMs: 349.292_000_000_000_03,
      } satisfies Details.Opportunity),
    ).toStrictEqual({
      issues: [
        {
          message: 'url, responseTime',
          severity: 'info',
        } satisfies Issue,
      ],
    });
  });
});
