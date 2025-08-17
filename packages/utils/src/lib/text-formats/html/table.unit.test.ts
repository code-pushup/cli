import type { Table } from '@code-pushup/models';
import { table } from './table.js';

describe('tableHtml', () => {
  it('should create a complete table', () => {
    const data: Table = {
      columns: [
        { key: 'date', label: 'Date of Action', align: 'right' },
        { key: 'time', label: 'Time of Action', align: 'left' },
        { key: 'action', label: 'Action' },
      ],
      rows: [{ date: '2025.01.01', time: '00:00:00', action: 'add item' }],
    };
    expect(table(data)).toMatchSnapshot();
  });
});
