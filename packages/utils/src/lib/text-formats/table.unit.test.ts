import { describe, expect, it } from 'vitest';
import { TableRowObject } from '@code-pushup/models';
import {
  columnsToStringArray,
  getColumnAlignmentForIndex,
  getColumnAlignmentForKeyAndIndex,
  getColumnAlignments,
  rowToStringArray,
} from './table';

describe('columnToStringArray', () => {
  it('should index primitive rows', () => {
    expect(
      columnsToStringArray({
        rows: [['a', 'b', 'c']],
      }),
    ).toStrictEqual(['0', '1', '2']);
  });

  it('should take keys as column heading', () => {
    expect(
      columnsToStringArray({
        rows: [{ prop1: 'prop value', prop2: 42 }],
      }),
    ).toStrictEqual(['prop1', 'prop2']);
  });

  it('should take keys defined in columns', () => {
    expect(
      columnsToStringArray({
        columns: [{ key: 'slug' }],
        rows: [{ slug: 'my-slug', value: 'my value' }],
      }),
    ).toStrictEqual(['Slug']);
  });

  it('should take labels defined in columns', () => {
    expect(
      columnsToStringArray({
        columns: [{ key: 'value', label: 'Value' }],
        rows: [{ slug: 'my-slug', value: 'my value' }],
      }),
    ).toStrictEqual(['Value']);
  });

  it('should only output headings row the present rows', () => {
    expect(
      columnsToStringArray({
        columns: [{ key: 'value', label: 'Value' }],
        rows: [{ slug: 'my-slug', value: 'my value' }],
      }),
    ).toStrictEqual(['Value']);
  });
});

describe('rowToStringArray', () => {
  it('turns row of primitive values row to a string array', () => {
    expect(rowToStringArray({ rows: [[1, 2, 3]] })).toStrictEqual([
      ['1', '2', '3'],
    ]);
  });

  it('turns row of object row to a string array', () => {
    expect(
      rowToStringArray({
        rows: [
          {
            prop1: 1,
            prop2: 2,
            prop3: 3,
          },
        ],
      }),
    ).toStrictEqual([['1', '2', '3']]);
  });

  it('turns row of object row defined by headings to a string array', () => {
    expect(
      rowToStringArray({
        rows: [
          {
            prop1: 1,
            prop2: 2,
            prop3: 3,
          },
        ],
        columns: [{ key: 'prop2' }],
      }),
    ).toStrictEqual([['2']]);
  });
});

describe('getColumnAlignmentForKey', () => {
  it('return center align for a key and no heading definitions', () => {
    expect(getColumnAlignmentForKeyAndIndex('value', 0)).toBe('center');
  });

  it('return center align for a key and heading definitions without align', () => {
    expect(
      getColumnAlignmentForKeyAndIndex('value', 0, [
        { key: 'value' },
        { key: 'other-prop' },
      ]),
    ).toBe('center');
  });

  it('return defined align for a key', () => {
    expect(
      getColumnAlignmentForKeyAndIndex('value', 0, [
        { key: 'value', align: 'left' },
        { key: 'other-prop' },
      ]),
    ).toBe('left');
  });
});

describe('getColumnAlignmentForIndex', () => {
  it('return center align for a index and no heading definitions', () => {
    expect(getColumnAlignmentForIndex(60)).toBe('center');
  });

  it('return center align for a index and heading definitions without align', () => {
    expect(getColumnAlignmentForIndex(1, ['left'])).toBe('center');
  });

  it('return defined align for a index', () => {
    expect(getColumnAlignmentForIndex(0, ['left'])).toBe('left');
  });
});

describe('getColumnAlignments', () => {
  it('return center alignments for primitive rows without heading definitions', () => {
    expect(getColumnAlignments({ rows: [[1, 2, 3]] })).toStrictEqual([
      'center',
      'center',
      'center',
    ]);
  });

  it('return alignments for primitive rows and heading definitions', () => {
    expect(
      getColumnAlignments({ rows: [[1, 2, 3]], columns: ['left'] }),
    ).toStrictEqual(['left', 'center', 'center']);
  });

  it('return center alignments for object rows without heading definitions', () => {
    expect(
      getColumnAlignments({
        rows: [
          { value: 1, name: 'first' },
          { value: 2, name: 'second' },
          { value: 3, name: 'third' },
        ],
      }),
    ).toStrictEqual(['center', 'center']);
  });

  it('return accept alignments for object rows and heading definitions', () => {
    expect(
      getColumnAlignments({
        rows: [
          { value: 1, name: 'first' },
          { value: 2, name: 'second' },
          { value: 3, name: 'third' },
        ],
        columns: [{ key: 'value', align: 'left' }],
      }),
    ).toStrictEqual(['left', 'center']);
  });

  it('return alignments for given headings and incomplete row data', () => {
    expect(
      getColumnAlignments({
        rows: [{ value: 1 }],
        columns: [{ key: 'value', align: 'left' }],
      }),
    ).toStrictEqual(['left', 'center']);
  });

  it('return alignments for biggest row if columns are missing', () => {
    expect(
      getColumnAlignments({
        rows: [{ value: 1 }, { value: 1, prop2: 42 }],
      }),
    ).toStrictEqual(['center', 'center']);
  });

  it('throws for a undefined row', () => {
    expect(() =>
      getColumnAlignments({ rows: [undefined as unknown as TableRowObject] }),
    ).toThrow('first row can`t be undefined.');
  });
});
