import { Table } from '@code-pushup/models';
import { tableHtml } from './table';

describe('tableHtml', () => {
  it('should create a complete table', () => {
    const data: Table = {
      headings: [
        { key: 'date', label: 'Date of Action' },
        { key: 'time', label: 'Time of Action' },
        { key: 'action', label: 'Action' },
      ],
      rows: [{ date: '2025.01.01', time: '00:00:00', action: 'add item' }],
      alignment: ['r', 'l', 'c'],
    };
    expect(tableHtml(data)).toMatchSnapshot();
  });
});
