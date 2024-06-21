import { Table } from '@code-pushup/models';
import { table } from './table';

describe('MD table', () => {
  it('should throw for empty data', () => {
    const data: Table = { rows: [] };
    expect(() => table(data)).toThrow("Data can't be empty");
  });

  it('should have a default alignment of "center"', () => {
    const data: Table = { rows: [[1, 2]] };
    const result = table(data);
    expect(result).toMatch('|:--:|:--:|');
  });

  it('should create a table with specified alignment', () => {
    const data: Table = {
      rows: [[1, 2, 3]],
      columns: ['left', 'center', 'right'],
    };
    const result = table(data);
    expect(result).toMatch('|:--|:--:|--:|');
  });

  it('should create a table from primitive values', () => {
    const data: Table = { rows: [['Value 1', 'Value 2']] };
    const result = table(data);
    expect(result).toMatch('|0|1|');
    expect(result).toMatch('|Value 1|Value 2|');
  });

  it('should create a table from object values', () => {
    const data: Table = {
      columns: [
        { key: 'col1', label: 'Header 1' },
        { key: 'col2', label: 'Header 2' },
      ],
      rows: [
        { col1: '1a', col2: '2a' },
        { col1: '1b', col2: '2b' },
      ],
    };
    const result = table(data);
    expect(result).toMatch('|Header 1|Header 2|');
    expect(result).toMatch('|1a|2a|');
    expect(result).toMatch('|1b|2b|');
  });

  it('should create a complete table', () => {
    const data: Table = {
      columns: [
        { key: 'date', label: 'Date of Action', align: 'right' },
        { key: 'time', label: 'Time of Action', align: 'left' },
        { key: 'action', label: 'Action' },
      ],
      rows: [
        { date: '2025.01.01', time: '00:00:00', action: 'add item' },
        { date: '2025.01.02' },
      ],
    };
    const result = table(data);
    expect(result).toMatch('|Date of Action|Time of Action|Action|');
    expect(result).toMatch('|--:|:--|:--:|');
    expect(result).toMatch('|2025.01.01|00:00:00|add item|');
    expect(result).toMatch('|2025.01.02|||');
  });
});
