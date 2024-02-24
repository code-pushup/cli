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
      toAuditOutputs({
        audit: {
          scoreDisplayMode: 'binary',
          title: 'audit',
          description: 'audit',
          score: null,
          id: 'audit',
        },
      }),
    ).toStrictEqual([
      {
        displayValue: undefined,
        score: 1,
        slug: 'audit',
        value: 0,
      },
    ]);
  });

  it('should not parse lhr details debugdata', () => {
    const outputs = toAuditOutputs({
      audit: {
        scoreDisplayMode: 'binary',
        title: 'audit',
        description: 'audit',
        score: null,
        id: 'audit',
        details: {
          type: 'debugdata',
          items: [
            {
              cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
            },
          ],
        },
      },
    });
    expect(outputs[0]?.details?.issues[0]).toEqual(
      expect.objectContaining({
        message: 'Parsing details from type debugdata is not implemented.',
        severity: 'info',
      }),
    );
  });

  it('should not parse lhr details filmstrip', () => {
    const outputs = toAuditOutputs({
      audit: {
        scoreDisplayMode: 'binary',
        title: 'audit',
        description: 'audit',
        score: null,
        id: 'audit',
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
    });

    expect(outputs[0]?.details?.issues[0]).toEqual(
      expect.objectContaining({
        message: 'Parsing details from type filmstrip is not implemented.',
        severity: 'info',
      }),
    );
  });

  it('should parse valid lhr details screenshot', () => {
    const outputs = toAuditOutputs({
      audit: {
        scoreDisplayMode: 'binary',
        title: 'audit',
        description: 'audit',
        score: null,
        id: 'audit',
        details: {
          type: 'screenshot',
          timing: 541,
          timestamp: 106_245_590_644,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
        },
      },
    });

    expect(outputs[0]?.details?.issues[0]).toEqual(
      expect.objectContaining({
        message: 'Parsing details from type screenshot is not implemented.',
        severity: 'info',
      }),
    );
  });

  it('should parse valid lhr details treemap-data', () => {
    const outputs = toAuditOutputs({
      audit: {
        scoreDisplayMode: 'binary',
        title: 'audit',
        description: 'audit',
        score: null,
        id: 'audit',
        details: {
          type: 'treemap-data',
          nodes: [],
        },
      },
    });

    expect(outputs[0]?.details?.issues[0]).toEqual(
      expect.objectContaining({
        message: 'Parsing details from type treemap-data is not implemented.',
        severity: 'info',
      }),
    );
  });

  it('should parse valid lhr details criticalrequestchain', () => {
    const outputs = toAuditOutputs({
      audit: {
        scoreDisplayMode: 'binary',
        title: 'audit',
        description: 'audit',
        score: null,
        id: 'audit',
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
    });

    expect(outputs[0]?.details?.issues[0]).toEqual(
      expect.objectContaining({
        message:
          'Parsing details from type criticalrequestchain is not implemented.',
        severity: 'info',
      }),
    );
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
  it('should parse valid lhr details', () => {
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
