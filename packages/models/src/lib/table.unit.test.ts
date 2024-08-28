import { describe, expect, it } from 'vitest';
import {
  type Table,
  type TableAlignment,
  type TableColumnObject,
  type TableColumnPrimitive,
  type TableRowObject,
  type TableRowPrimitive,
  tableAlignmentSchema,
  tableColumnObjectSchema,
  tableColumnPrimitiveSchema,
  tableRowObjectSchema,
  tableRowPrimitiveSchema,
  tableSchema,
} from './table';

describe('tableAlignmentSchema', () => {
  it('should accept a valid enum', () => {
    const alignment: TableAlignment = 'center';
    expect(() => tableAlignmentSchema.parse(alignment)).not.toThrow();
  });

  it('should throw for a invalid enum', () => {
    const alignment = 'crooked';
    expect(() => tableAlignmentSchema.parse(alignment)).toThrow(
      'invalid_enum_value',
    );
  });
});

describe('tableColumnPrimitiveSchema', () => {
  it('should accept a valid enum', () => {
    const column: TableColumnPrimitive = 'center';
    expect(() => tableColumnPrimitiveSchema.parse(column)).not.toThrow();
  });

  it('should throw for a invalid enum', () => {
    const column = 'crooked';
    expect(() => tableColumnPrimitiveSchema.parse(column)).toThrow(
      'invalid_enum_value',
    );
  });
});

describe('tableColumnObjectSchema', () => {
  it('should accept a valid object', () => {
    const column: TableColumnObject = { key: 'value' };
    expect(() => tableColumnObjectSchema.parse(column)).not.toThrow();
  });

  it('should throw for a invalid object', () => {
    const column = { test: 42 };
    expect(() => tableColumnObjectSchema.parse(column)).toThrow('invalid_type');
  });
});

describe('tableRowPrimitiveSchema', () => {
  it('should accept a valid array', () => {
    const row: TableRowPrimitive = ['100 ms'];
    expect(() => tableRowPrimitiveSchema.parse(row)).not.toThrow();
  });

  it('should throw for a invalid array', () => {
    const row = [{}];
    expect(() => tableRowPrimitiveSchema.parse(row)).toThrow(
      'Expected string, received object',
    );
  });
});

describe('tableRowObjectSchema', () => {
  it('should accept a valid object', () => {
    const row: TableRowObject = { key: 'value' };
    expect(() => tableRowObjectSchema.parse(row)).not.toThrow();
  });

  it('should default undefined object values to null', () => {
    const row = { prop: undefined };
    expect(tableRowObjectSchema.parse(row)).toStrictEqual({
      prop: null,
    });
  });

  it('should throw for a invalid object', () => {
    const row = { prop: [] };
    expect(() => tableRowObjectSchema.parse(row)).toThrow('invalid_union');
  });
});

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

  it('should throw for mixed column types', () => {
    const table = {
      rows: [['1', { prop1: '2' }]],
    };
    expect(() => tableSchema().parse(table)).toThrow(
      'Expected string, received object',
    );
  });

  it('should throw for unsupported combination of rows and column types', () => {
    const table = {
      rows: [['1']],
      columns: [{ key: 'prop1' }],
    };
    expect(() => tableSchema().parse(table)).toThrow('invalid_union');
  });

  it('should parse table with rows and columns with alignment only', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      columns: ['left'],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse table with rows and columns with keys only', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      columns: [{ key: 'metrics' }],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse table with rows and columns', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      columns: [{ key: 'metrics', label: 'Metrics Name' }],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse table with rows and columns and alignments', () => {
    const table: Table = {
      rows: [{ metrics: 'TTFB' }],
      columns: [{ key: 'metrics', label: 'Metrics Name', align: 'left' }],
    };
    expect(() => tableSchema().parse(table)).not.toThrow();
  });

  it('should parse complete table', () => {
    const fullTable: Table = {
      title: 'Largest Contentful Paint element',
      columns: [
        // center is often the default when rendering in MD or HTML
        { key: 'phase', label: 'Phase' },
        { key: 'percentageLcp', label: '% of LCP', align: 'right' },
        { key: 'timing', label: 'Timing', align: 'left' },
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
