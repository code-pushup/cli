import { NEW_LINE } from './constants';
import { Alignment, tableMd } from './table';

describe('table function', () => {
  it('should create a table with center alignment by default', () => {
    const data: (string | number)[][] = [
      ['Header 1', 'Header 2'],
      ['row1col1', 'row1col2'],
      ['row2col1', 'row2col2'],
    ];
    const result = tableMd(data);
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
    const result = tableMd(data, align);
    const expected = `|Header 1|Header 2|${NEW_LINE}|:--|--:|${NEW_LINE}|row1col1|row1col2|${NEW_LINE}|row2col1|row2col2|`;
    expect(result).toBe(expected);
  });

  it('should throw for empty data', () => {
    const data: (string | number)[][] = [];
    expect(() => tableMd(data)).toThrow("Data can't be empty");
  });

  it('should create a table with a single row', () => {
    const data: (string | number)[][] = [['Header 1', 'Header 2']];
    const result = tableMd(data);
    const expected = `|Header 1|Header 2|`;
    expect(result).toContain(expected);
  });

  it('should include number values', () => {
    const data: (string | number)[][] = [
      ['Header 1', 'Header 2'],
      [1, 2],
      [3, 4],
    ];
    const result = tableMd(data);
    const expected = `|Header 1|Header 2|${NEW_LINE}|:--:|:--:|${NEW_LINE}|1|2|${NEW_LINE}|3|4|`;
    expect(result).toBe(expected);
  });
});
