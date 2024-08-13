import type Details from 'lighthouse/types/lhr/audit-details';
import { describe, expect, it } from 'vitest';
import { Table } from '@code-pushup/models';
import {
  parseTableColumns,
  parseTableEntry,
  parseTableRow,
  parseTableToAuditDetailsTable,
} from './table.type';
import { LighthouseAuditDetailsParsingError } from './utils';

describe('parseTableToAuditDetails', () => {
  it('should render complete details of type table', () => {
    const outputs = parseTableToAuditDetailsTable({
      type: 'table',
      headings: [
        {
          key: 'statistic',
          valueType: 'text',
          label: 'Statistic',
        },
        {
          key: 'node',
          valueType: 'node',
          label: 'Element',
        },
        {
          key: 'value',
          valueType: 'numeric',
          label: 'Value',
        },
      ],
      items: [
        {
          statistic: 'Total DOM Elements',
          value: {
            type: 'numeric',
            granularity: 1,
            value: 138,
          },
        },
        {
          node: {
            type: 'node',
            lhId: '1-5-IMG',
            path: '1,HTML,1,BODY,1,CP-ROOT,0,HEADER,0,DIV,1,NAV,0,UL,0,LI,0,A,0,IMG',
            selector: 'ul.navigation > li > a.nav-item > img.icon',
            boundingRect: {
              top: 12,
              bottom: 44,
              left: 293,
              right: 325,
              width: 32,
              height: 32,
            },
            snippet:
              '<img _ngcontent-ng-c3690293395="" ngsrc="assets/github.svg" alt="" height="32" width="32" class="icon" loading="lazy" fetchpriority="auto" ng-img="true" src="assets/github.svg">',
            nodeLabel: 'ul.navigation > li > a.nav-item > img.icon',
          },
          statistic: 'Maximum DOM Depth',
          value: {
            type: 'numeric',
            granularity: 1,
            value: 9,
          },
        },
        {
          node: {
            type: 'node',
            lhId: '1-6-P',
            path: '1,HTML,1,BODY,1,CP-ROOT,4,FOOTER,0,DIV,0,P',
            selector: 'cp-root > footer.footer > div.footer-content > p.legal',
            boundingRect: {
              top: 5705,
              bottom: 5914,
              left: 10,
              right: 265,
              width: 254,
              height: 209,
            },
            snippet: '<p _ngcontent-ng-c3690293395="" class="legal">',
            nodeLabel:
              'CodePushUp, s.r.o.\n\nKorunní 2569/108,\n101 00, Prague,\nIČ: 19880197\n\nhello@code-…',
          },
          statistic: 'Maximum Child Elements',
          value: {
            type: 'numeric',
            granularity: 1,
            value: 9,
          },
        },
      ],
    } satisfies Details.Table);

    expect(outputs).toStrictEqual({
      columns: [
        {
          key: 'statistic',
          label: 'Statistic',
          align: 'left',
        },
        {
          key: 'node',
          label: 'Element',
          align: 'left',
        },
        {
          key: 'value',
          label: 'Value',
          align: 'left',
        },
      ],
      rows: [
        {
          statistic: 'Total DOM Elements',
          value: '138',
        },
        {
          statistic: 'Maximum DOM Depth',
          node: 'ul.navigation > li > a.nav-item > img.icon',
          value: '9',
        },
        {
          statistic: 'Maximum Child Elements',
          node: 'cp-root > footer.footer > div.footer-content > p.legal',
          value: '9',
        },
      ],
    } satisfies Table);
  });

  it('should omit empty table', () => {
    const outputs = parseTableToAuditDetailsTable({
      type: 'table',
      headings: [],
      items: [],
    } as Details.Table);

    expect(outputs).toBeUndefined();
  });

  it('should accept rows with primitive values', () => {
    const outputs = parseTableToAuditDetailsTable({
      type: 'table',
      headings: [
        {
          key: 'label',
          valueType: 'text',
          label: 'Resource Type',
        },
        {
          key: 'requestCount',
          valueType: 'numeric',
          label: 'Requests',
        },
        {
          key: 'transferSize',
          valueType: 'bytes',
          label: 'Transfer Size',
        },
      ],
      items: [
        {
          resourceType: 'total',
          label: 'Total',
          requestCount: 14,
          transferSize: 441_023,
        },
        {
          resourceType: 'image',
          label: 'Image',
          requestCount: 9,
          transferSize: 357_829,
        },
        {
          resourceType: 'font',
          label: 'Font',
          requestCount: 2,
          transferSize: 41_206,
        },
        {
          resourceType: 'script',
          label: 'Script',
          requestCount: 1,
          transferSize: 38_076,
        },
        {
          resourceType: 'document',
          label: 'Document',
          requestCount: 1,
          transferSize: 3455,
        },
        {
          resourceType: 'stylesheet',
          label: 'Stylesheet',
          requestCount: 1,
          transferSize: 457,
        },
        {
          resourceType: 'media',
          label: 'Media',
          requestCount: 0,
          transferSize: 0,
        },
        {
          resourceType: 'other',
          label: 'Other',
          requestCount: 0,
          transferSize: 0,
        },
        {
          resourceType: 'third-party',
          label: 'Third-party',
          requestCount: 2,
          transferSize: 41_206,
        },
      ],
    } as Details.Table);

    expect(outputs).toEqual({
      columns: [
        {
          align: 'left',
          key: 'label',
          label: 'Resource Type',
        },
        {
          align: 'left',
          key: 'requestCount',
          label: 'Requests',
        },
        {
          align: 'left',
          key: 'transferSize',
          label: 'Transfer Size',
        },
      ],
      rows: [
        {
          label: 'Total',
          requestCount: '14',
          transferSize: '430.69 kB',
        },
        {
          label: 'Image',
          requestCount: '9',
          transferSize: '349.44 kB',
        },
        {
          label: 'Font',
          requestCount: '2',
          transferSize: '40.24 kB',
        },
        {
          label: 'Script',
          requestCount: '1',
          transferSize: '37.18 kB',
        },
        {
          label: 'Document',
          requestCount: '1',
          transferSize: '3.37 kB',
        },
        {
          label: 'Stylesheet',
          requestCount: '1',
          transferSize: '457 B',
        },
        {
          label: 'Media',
          requestCount: '0',
          transferSize: '0 B',
        },
        {
          label: 'Other',
          requestCount: '0',
          transferSize: '0 B',
        },
        {
          label: 'Third-party',
          requestCount: '2',
          transferSize: '40.24 kB',
        },
      ],
    } satisfies Table);
  });

  it('should throw for invalid table', () => {
    const headings = ['left'];
    const items = [undefined];
    const rawTable: Details.Table = {
      type: 'table',
      headings: headings as unknown as Details.TableColumnHeading[],
      items: items as unknown as Details.TableItem[],
    };

    expect(() => parseTableToAuditDetailsTable(rawTable)).toThrow(
      new LighthouseAuditDetailsParsingError(
        'table',
        {
          items: [null],
          headings,
        },
        'Cannot convert undefined or null to object',
      ),
    );
  });
});

describe('parseTableColumns', () => {
  it('should return for empty columns', () => {
    const outputs = parseTableColumns([]);
    expect(outputs).toStrictEqual([]);
  });

  it('should fall back to empty string if key property is missing', () => {
    const outputs = parseTableColumns([
      {
        keyy: 'prop',
        label: 'PROP',
      } as unknown as Details.TableColumnHeading,
    ]);

    expect(outputs).toEqual([expect.objectContaining({ key: '' })]);
  });

  it('should remove label property if undefined', () => {
    const outputs = parseTableColumns([
      {
        key: 'prop',
      } as unknown as Details.TableColumnHeading,
    ]);

    expect(outputs).toEqual([
      expect.not.objectContaining({ label: expect.anything() }),
    ]);
  });

  it('should remove label property if empty string', () => {
    const outputs = parseTableColumns([
      {
        key: 'prop',
      } as unknown as Details.TableColumnHeading,
    ]);

    expect(outputs).toEqual([
      expect.not.objectContaining({ label: expect.anything() }),
    ]);
  });

  it('should fill align with "left"', () => {
    const outputs = parseTableColumns([
      {
        key: 'prop',
        label: 'PROP',
      } as Details.TableColumnHeading,
    ]);

    expect(outputs).toEqual([expect.objectContaining({ align: 'left' })]);
  });

  it('should accept columns', () => {
    const outputs = parseTableColumns([
      {
        key: 'prop',
        label: 'PROP',
      } as Details.TableColumnHeading,
    ]);

    expect(outputs).toStrictEqual([
      {
        align: 'left',
        key: 'prop',
        label: 'PROP',
      },
    ]);
  });
});

describe('parseTableRow', () => {
  it('should accept rows with primitive values', () => {
    const outputs = parseTableRow({ value: 12 }, []);

    expect(outputs).toEqual({});
  });

  it('should filter keys by headings', () => {
    const outputs = parseTableRow({ value: 12, tralala: '42' }, [
      { key: 'tralala' },
    ] as Details.TableColumnHeading[]);

    expect(outputs).toEqual({ tralala: '42' });
  });

  it('should render complete details of type table', () => {
    const outputs = parseTableRow({ value: 12 }, []);
    expect(outputs).toEqual({});
  });
});

describe('parseTableEntry', () => {
  it('should forward nullish values', () => {
    const outputs = parseTableEntry(['prop1', undefined]);

    expect(outputs).toStrictEqual(['prop1', undefined]);
  });

  it('should forward non nullish values', () => {
    const outputs = parseTableEntry(['prop1', 42]);

    expect(outputs).toStrictEqual(['prop1', 42]);
  });
});
