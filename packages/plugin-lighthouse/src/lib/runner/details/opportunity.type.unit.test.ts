import type Details from 'lighthouse/types/lhr/audit-details';
import { describe, expect, it } from 'vitest';
import type { Table } from '@code-pushup/models';
import { parseOpportunityToAuditDetailsTable } from './opportunity.type.js';
import { LighthouseAuditDetailsParsingError } from './utils.js';

describe('parseOpportunityDetails', () => {
  it('should omit empty opportunities', () => {
    const outputs = parseOpportunityToAuditDetailsTable({
      type: 'opportunity',
      headings: [],
      items: [],
      overallSavingsMs: 0,
      overallSavingsBytes: 0,
      sortedBy: ['wastedBytes'],
      debugData: {
        type: 'debugdata',
        metricSavings: {
          FCP: 0,
          LCP: 0,
        },
      },
    } satisfies Details.Opportunity);

    expect(outputs).toBeUndefined();
  });

  it('should format bytes', () => {
    const outputs = parseOpportunityToAuditDetailsTable({
      type: 'opportunity',
      headings: [
        { key: 'totalBytes' },
        { key: 'wastedBytes' },
      ] as Details.TableColumnHeading[],
      items: [
        {
          totalBytes: 78_235,
          wastedBytes: 75_110,
          url: 'xyz',
        },
      ],
    });

    expect(outputs?.rows.at(0)).toEqual(
      expect.objectContaining({
        totalBytes: '76.4 kB',
        wastedBytes: '73.35 kB',
      }),
    );
  });

  it('should format percentage', () => {
    const outputs = parseOpportunityToAuditDetailsTable({
      type: 'opportunity',
      headings: [{ key: 'wastedPercent' }],
      items: [
        {
          wastedPercent: 96.005_048_796_985_22,
        } as unknown as Details.OpportunityItem,
      ],
    } as Details.Opportunity);

    expect(outputs?.rows.at(0)).toEqual(
      expect.objectContaining({
        wastedPercent: '96.01 %',
      }),
    );
  });

  it('should format node', () => {
    const outputs = parseOpportunityToAuditDetailsTable({
      type: 'opportunity',
      headings: [{ key: 'node', valueType: 'node' }],
      items: [
        {
          node: { type: 'node', selector: 'h1' },
        } as unknown as Details.OpportunityItem,
      ],
    } as Details.Opportunity);

    expect(outputs?.rows.at(0)).toEqual(
      expect.objectContaining({
        node: 'h1',
      }),
    );
  });

  it('should accept empty node', () => {
    const outputs = parseOpportunityToAuditDetailsTable({
      type: 'opportunity',
      headings: [{ key: 'node', valueType: 'node' }],
      items: [
        {
          node: undefined,
        } as unknown as Details.OpportunityItem,
      ],
    } as Details.Opportunity);

    expect(outputs?.rows).toEqual([{ node: null }]);
  });

  it('should render complete details of type opportunity', () => {
    const outputs = parseOpportunityToAuditDetailsTable({
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
        {
          key: 'wastedMs',
          valueType: 'ms',
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
          wastedMs: 742,
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
          wastedMs: 942,
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
        {
          key: 'wastedMs',
          label: 'Potential Savings',
          align: 'left',
        },
      ],
      rows: [
        {
          node: 'div.feature > cp-window-frame.window > div.body > img.product-screen',
          url: '<a href="https://codepushup.dev/assets/code-suggestion.webp">https://codepushup.dev/assets/code-suggestion.webp</a>',
          totalBytes: '76.4 kB',
          wastedBytes: '73.35 kB',
          wastedMs: '742 ms',
        },
        {
          node: 'div.feature > cp-window-frame.window > div.body > img.product-screen',
          url: '<a href="https://codepushup.dev/assets/category-detail.webp">https://codepushup.dev/assets/category-detail.webp</a>',
          totalBytes: '52.34 kB',
          wastedBytes: '48.72 kB',
          wastedMs: '942 ms',
        },
      ],
    } satisfies Table);
  });

  it('should throw for invalid opportunity', () => {
    const headings = ['left'];
    const items = [undefined];
    const rawTable: Details.Opportunity = {
      type: 'opportunity',
      headings: headings as unknown as Details.TableColumnHeading[],
      items: items as unknown as Details.OpportunityItem[],
    };

    expect(() => parseOpportunityToAuditDetailsTable(rawTable)).toThrow(
      new LighthouseAuditDetailsParsingError(
        'opportunity',
        {
          items: [null],
          headings,
        },
        'Cannot convert undefined or null to object',
      ),
    );
  });
});
