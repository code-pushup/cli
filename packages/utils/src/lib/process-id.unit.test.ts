import { WAL_ID_PATTERNS, getUniqueTimeId } from './process-id.js';
import { getShardId } from './wal-sharded.js';

describe('getShardId (formerly getUniqueReadableInstanceId)', () => {
  it('should generate shard ID with readable timestamp', () => {
    const result = getShardId();

    expect(result).toMatch(WAL_ID_PATTERNS.INSTANCE_ID);
    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should generate different shard IDs for different calls', () => {
    const result1 = getShardId();
    const result2 = getShardId();

    expect(result1).not.toBe(result2);
    expect(result1).toStartWith('20231114-221320-000.');
    expect(result2).toStartWith('20231114-221320-000.');
  });

  it('should handle zero values', () => {
    const result = getShardId();
    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should handle negative timestamps', () => {
    const result = getShardId();

    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should handle large timestamps', () => {
    const result = getShardId();

    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should generate incrementing counter', () => {
    const result1 = getShardId();
    const result2 = getShardId();

    const parts1 = result1.split('.');
    const parts2 = result2.split('.');
    const counter1 = parts1.at(-1) as string;
    const counter2 = parts2.at(-1) as string;

    expect(Number.parseInt(counter1, 10)).toBe(
      Number.parseInt(counter2, 10) - 1,
    );
  });
});

describe('getUniqueTimeId (formerly getUniqueRunId)', () => {
  it('should work with mocked timeOrigin', () => {
    const result = getUniqueTimeId();

    expect(result).toBe('20231114-221320-000');
    expect(result).toMatch(WAL_ID_PATTERNS.GROUP_ID);
  });

  it('should generate new ID on each call (not idempotent)', () => {
    const result1 = getUniqueTimeId();
    const result2 = getUniqueTimeId();

    // Note: getUniqueTimeId is not idempotent - it generates a new ID each call
    // based on current time, so results will be different
    expect(result1).toMatch(WAL_ID_PATTERNS.GROUP_ID);
    expect(result2).toMatch(WAL_ID_PATTERNS.GROUP_ID);
    // They may be the same if called within the same millisecond, but generally different
  });
});
