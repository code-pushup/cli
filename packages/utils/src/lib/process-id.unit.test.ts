import {
  WAL_ID_PATTERNS,
  getUniqueReadableInstanceId,
  getUniqueRunId,
} from './process-id.js';

describe('getUniqueReadableInstanceId', () => {
  it('should generate shard ID with readable timestamp', () => {
    const result = getUniqueReadableInstanceId();

    expect(result).toMatch(WAL_ID_PATTERNS.INSTANCE_ID);
    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should generate different shard IDs for different calls', () => {
    const result1 = getUniqueReadableInstanceId();
    const result2 = getUniqueReadableInstanceId();

    expect(result1).not.toBe(result2);
    expect(result1).toStartWith('20231114-221320-000.');
    expect(result2).toStartWith('20231114-221320-000.');
  });

  it('should handle zero values', () => {
    const result = getUniqueReadableInstanceId();
    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should handle negative timestamps', () => {
    const result = getUniqueReadableInstanceId();

    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should handle large timestamps', () => {
    const result = getUniqueReadableInstanceId();

    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should generate incrementing counter', () => {
    const result1 = getUniqueReadableInstanceId();
    const result2 = getUniqueReadableInstanceId();

    const parts1 = result1.split('.');
    const parts2 = result2.split('.');
    const counter1 = parts1.at(-1) as string;
    const counter2 = parts2.at(-1) as string;

    expect(Number.parseInt(counter1, 10)).toBe(
      Number.parseInt(counter2, 10) - 1,
    );
  });
});

describe('getUniqueRunId', () => {
  it('should work with mocked timeOrigin', () => {
    const result = getUniqueRunId();

    expect(result).toBe('20231114-221320-000');
    expect(result).toMatch(WAL_ID_PATTERNS.GROUP_ID);
  });

  it('should be idempotent within same process', () => {
    const result1 = getUniqueRunId();
    const result2 = getUniqueRunId();

    expect(result1).toBe(result2);
  });
});
