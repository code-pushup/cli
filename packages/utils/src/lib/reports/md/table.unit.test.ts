import { Table } from '@code-pushup/models';
import { tableMd } from './table';

describe('table function', () => {
  it('should create a table with center alignment by default', () => {
    const data: Table = { rows: [[1, 2]] };
    const result = tableMd(data);
    expect(result).toMatch('|:--:|:--:|');
  });

  it('should create a table with specified alignment', () => {
    const data: Table = {
      rows: [[1, 2, 3]],
      headings: [{ align: 'l' }, {}, { align: 'r' }],
    };
    const result = tableMd(data);
    expect(result).toMatch('|:--|:--:|--:|');
  });

  it('should throw for empty data', () => {
    const data: Table = { rows: [] };
    expect(() => tableMd(data)).toThrow("Data can't be empty");
  });

  it('should create a table from primitive values', () => {
    const data: Table = { rows: [['Value 1', 'Value 2']] };
    const result = tableMd(data);
    expect(result).toMatch('|0|1|');
    expect(result).toMatch('|Value 1|Value 2|');
  });

  it('should create a table from object values', () => {
    const data: Table = {
      headings: [
        { key: 'col1', label: 'Header 1' },
        { key: 'col2', label: 'Header 2' },
      ],
      rows: [{ col1: '11', col2: '12' }],
    };
    const result = tableMd(data);
    expect(result).toMatch('|Header 1|Header 2|');
    expect(result).toMatch('|11|12|');
  });

  it('should create a complete table', () => {
    const data: Table = {
      headings: [
        { key: 'date', label: 'Date of Action', align: 'r' },
        { key: 'time', label: 'Time of Action', align: 'l' },
        { key: 'action', label: 'Action', align: 'c' },
      ],
      rows: [{ date: '2025.01.01', time: '00:00:00', action: 'add item' }],
    };
    const result = tableMd(data);
    expect(result).toMatch('|Date of Action|Time of Action|Action|');
    expect(result).toMatch('|--:|:--|:--:|');
    expect(result).toMatch('|2025.01.01|00:00:00|add item|');
  });
});
