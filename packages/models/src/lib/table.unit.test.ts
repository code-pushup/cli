import { describe, expect, it } from 'vitest';
import { Table, tableSchema } from './table';

describe('tableSchema', () => {
  it('should accept a valid table with primitive data rows only', () => {
    const table: Table = {
      rows: [
        ['TTFB', '27%', '620 ms'],
        ['Load Delay', '25%', '580 ms'],
      ],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse table with object data rows only', () => {
    const table: Table = { rows: [{ metrics: 'TTFB' }] };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should not throw for empty rows', () => {
    const table: Table = {
      rows: [],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should throw for unsupported values in rows', () => {
    const table: Table = {
      rows: [[[] as unknown as string]],
    };
    expect(() => tableSchema().parse(table)).toThrow(
      'Expected string, received array',
    );
  });

  it('should parse table with rows and headings with keys only', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      headings: [{ key: 'metrics' }],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse table with rows and headings', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      headings: [{ key: 'metrics', label: 'Metrics Name' }],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse table with rows and headings and alignments', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      headings: [{ key: 'metrics', label: 'Metrics Name', align: 'l' }],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse complete table', () => {
    const fullTable: Table = {
      headings: [
        // center is often the default when rendering in MD or HTML
        { key: 'phase', label: 'Phase' },
        { key: 'percentageLcp', label: '% of LCP', align: 'r' },
        { key: 'timing', label: 'Timing', align: 'l' },
      ],
      rows: [
        {
          phase: 'TTFB',
          percentageLcp: '27%',
          timing: '620 ms',
        },
        {
          phase: 'Load Delay',
          percentageLcp: '25%',
          timing: '580 ms',
        },
        {
          phase: 'Load Time',
          percentageLcp: '41%',
          timing: '940 ms',
        },
        {
          phase: 'Render Delay',
          percentageLcp: '6%',
          timing: '140 ms',
        },
      ],
    };
    expect(() => tableSchema().parse(fullTable)).not.toThrow();
  });
});
