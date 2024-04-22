import {describe, expect, it} from "vitest";
import Details from "lighthouse/types/lhr/audit-details";
import {parseOpportunityDetails} from "./opportunity.type";

describe.skip('parseOpportunityDetails', () => {

  it('should omit empty opportunities', () => {
    const outputs = parseOpportunityDetails({
        type: "opportunity",
        headings: [],
        items: [],
        overallSavingsMs: 0
    } as Details.Opportunity);

    expect(outputs).toEqual({});
  });

  it('should format bytes', () => {
    const outputs = parseOpportunityDetails({
      type: 'opportunity',
      headings: [{key: 'totalBytes'}, {key: 'wastedBytes'}],
      items: [{
        node: {type: 'node'},
        totalBytes: 78235,
        wastedBytes: 75110,
      } as unknown as Details.OpportunityItem]
    } as Details.Opportunity);

    expect(outputs?.table?.rows.at(0)).toEqual(expect.objectContaining({
          totalBytes: '76.4 kB',
          wastedBytes: '73.35 kB'
    }));
  });

  it('should format percentage', () => {
    const outputs = parseOpportunityDetails({
      type: 'opportunity',
      headings: [{key: 'wastedPercent'}],
      items: [{
        node: {type: 'node'},
        wastedPercent: 96.00504879698522,
      } as unknown as Details.OpportunityItem]
    } as Details.Opportunity);

    expect(outputs?.table?.rows.at(0)).toEqual(expect.objectContaining({
      wastedPercent: '96.01 %',
    }));
  });

  it('should format node', () => {
    const outputs = parseOpportunityDetails({
      type: 'opportunity',
      headings: [{key: 'node'}],
      items: [{
        node: {type: 'node', selector: 'h1'},
        wastedPercent: 96.00504879698522,
      } as unknown as Details.OpportunityItem]
    } as Details.Opportunity);

    expect(outputs?.table?.rows.at(0)).toEqual(expect.objectContaining({
      node: 'h1',
    }));
  });

  it('should accept empty node', () => {
    const outputs = parseOpportunityDetails({
      type: 'opportunity',
      headings: [{key: 'node'}],
      items: [{
        node: undefined,
        wastedPercent: 96.00504879698522,
      } as unknown as Details.OpportunityItem]
    } as Details.Opportunity);

    expect(outputs?.table?.rows.at(0)).toEqual(expect.objectContaining({
      node: undefined,
    }));
  });

  it('should render complete details of type opportunity', () => {
    const outputs = parseOpportunityDetails({
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
          totalBytes: 78235,
          wastedBytes: 75110,
          wastedPercent: 96.00504879698522,
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
          totalBytes: 53596,
          wastedBytes: 49890,
          wastedPercent: 93.08450581900296,
        },
      ],
      overallSavingsMs: 1750,
      overallSavingsBytes: 333817,
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
        headings: [
          {
            key: 'node',
            label: '',
          },
          {
            key: 'url',
            label: 'URL',
          },
          {
            key: 'totalBytes',
            label: 'Resource Size',
          },
          {
            key: 'wastedBytes',
            label: 'Potential Savings',
          },
        ],
        alignment: ['l', 'c', 'l', 'l'],
        rows: [
          {
            node: 'div.feature > cp-window-frame.window > div.body > img.product-screen',
            url: 'https://codepushup.dev/assets/code-suggestion.webp',
            totalBytes: '76.4 kB',
            wastedBytes: '73.35 kB',
          },
          {
            node: 'div.feature > cp-window-frame.window > div.body > img.product-screen',
            url: 'https://codepushup.dev/assets/category-detail.webp',
            totalBytes: '52.34 kB',
            wastedBytes: '48.72 kB',
          },
        ],
      },
    });
  });
})
