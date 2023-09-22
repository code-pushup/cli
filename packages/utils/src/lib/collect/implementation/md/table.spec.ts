import { NEW_LINE } from './constants';
import { table, Alignment } from './table';

describe('table function', () => {
  it('should create a table with center alignment by default', () => {
    const data: (string | number)[][] = [
      ['Header 1', 'Header 2'],
      ['row1col1', 'row1col2'],
      ['row2col1', 'row2col2'],
    ];
    const result = table(data);
    const expected = `|Header 1|Header 2|${NEW_LINE}|:--:|:--:|${NEW_LINE}|row1col1|row1col2|${NEW_LINE}|row2col1|row2col2|`;
    expect(result).toBe(expected);
  });

  it('should create a table with specified alignment', () => {
    const data: (string | number)[][] = [
      ['Header 1', 'Header 2'],
      ['row1col1', 'row1col2'],
      ['row2col1', 'row2col2'],
    ];
    const align: Alignment[] = ['l', 'r'];
    const result = table(data, align);
    const expected = `|Header 1|Header 2|${NEW_LINE}|:--|--:|${NEW_LINE}|row1col1|row1col2|${NEW_LINE}|row2col1|row2col2|`;
    expect(result).toBe(expected);
  });

  it('should handle empty data', () => {
    const data: (string | number)[][] = [];
    expect(() => table(data)).toThrow("Data can't be empty");
  });

  it('should handle single row data', () => {
    const data: (string | number)[][] = [['Header 1', 'Header 2']];
    const result = table(data);
    const expected = `|Header 1|Header 2|`;
    expect(result).toContain(expected);
  });

  it('should handle number values', () => {
    const data: (string | number)[][] = [
      ['Header 1', 'Header 2'],
      [1, 2],
      [3, 4],
    ];
    const result = table(data);
    const expected = `|Header 1|Header 2|${NEW_LINE}|:--:|:--:|${NEW_LINE}|1|2|${NEW_LINE}|3|4|`;
    expect(result).toBe(expected);
  });
});
