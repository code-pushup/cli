import { describe } from 'vitest';
import { groupByStatus } from './group-by-status.js';

describe('groupByStatus', () => {
  it('should group results by status', () => {
    const results = [
      { status: 'fulfilled', value: 'first' },
      { status: 'rejected', reason: 'second' },
      { status: 'fulfilled', value: 'third' },
    ] as PromiseSettledResult<string>[];
    const grouped = groupByStatus(results);
    expect(grouped).toEqual({
      fulfilled: [
        { status: 'fulfilled', value: 'first' },
        { status: 'fulfilled', value: 'third' },
      ],
      rejected: [{ status: 'rejected', reason: 'second' }],
    });
  });
});
