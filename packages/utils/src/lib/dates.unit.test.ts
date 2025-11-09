import { dateToUnixTimestamp } from './dates.js';

describe('dateToUnixTimestamp', () => {
  it('should convert date to number of seconds since epoch', () => {
    expect(dateToUnixTimestamp(new Date('1970-01-01T01:00:04.567Z'))).toBe(
      3605, // 1 hour is 3600 seconds + 4.567 seconds is rounded up to 5 seconds
    );
  });
});
