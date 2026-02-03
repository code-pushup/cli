import { threadId } from 'node:worker_threads';
import {
  type Counter,
  ID_PATTERNS,
  TIME_ID_BASE,
  getUniqueInstanceId,
  getUniqueProcessThreadId,
  getUniqueTimeId,
  sortableReadableDateString,
} from './process-id.js';

describe('TIME_ID_BASE', () => {
  it.each([
    '20231114-221320-000',
    '20240101-120000-000',
    '20231231-235959-999',
  ])('should match valid time ID format: %s', timeId => {
    expect(timeId).toMatch(TIME_ID_BASE);
  });

  it.each(['2023-11-14', '20231114', '20231114-221320', 'invalid'])(
    'should not match invalid time ID format: %s',
    timeId => {
      expect(timeId).not.toMatch(TIME_ID_BASE);
    },
  );
});

describe('ID_PATTERNS', () => {
  it.each(['20231114-221320-000', '20240101-120000-000'])(
    'TIME_ID should match valid time ID: %s',
    timeId => {
      expect(timeId).toMatch(ID_PATTERNS.TIME_ID);
    },
  );

  it.each(['20231114-221320-000.123', '20231114-221320'])(
    'TIME_ID should not match invalid format: %s',
    timeId => {
      expect(timeId).not.toMatch(ID_PATTERNS.TIME_ID);
    },
  );

  it.each(['20231114-221320-000'])(
    'GROUP_ID should match valid group ID: %s',
    groupId => {
      expect(groupId).toMatch(ID_PATTERNS.GROUP_ID);
    },
  );

  it.each(['20231114-221320-000-12345-1', '20240101-120000-000-99999-99'])(
    'PROCESS_THREAD_ID should match valid process/thread ID: %s',
    processThreadId => {
      expect(processThreadId).toMatch(ID_PATTERNS.PROCESS_THREAD_ID);
    },
  );

  it.each(['20231114-221320-000', '20231114-221320-000-12345'])(
    'PROCESS_THREAD_ID should not match invalid format: %s',
    processThreadId => {
      expect(processThreadId).not.toMatch(ID_PATTERNS.PROCESS_THREAD_ID);
    },
  );

  it.each(['20231114-221320-000.12345.1.1', '20240101-120000-000.99999.99.42'])(
    'INSTANCE_ID should match valid instance ID: %s',
    instanceId => {
      expect(instanceId).toMatch(ID_PATTERNS.INSTANCE_ID);
    },
  );

  it.each(['20231114-221320-000', '20231114-221320-000-12345-1'])(
    'INSTANCE_ID should not match invalid format: %s',
    instanceId => {
      expect(instanceId).not.toMatch(ID_PATTERNS.INSTANCE_ID);
    },
  );

  it.each(['20231114-221320-000.12345.1.1'])(
    'SHARD_ID should match valid shard ID (deprecated alias): %s',
    shardId => {
      expect(shardId).toMatch(ID_PATTERNS.SHARD_ID);
    },
  );

  it.each(['20231114-221320-000'])(
    'READABLE_DATE should match valid readable date (deprecated alias): %s',
    readableDate => {
      expect(readableDate).toMatch(ID_PATTERNS.READABLE_DATE);
    },
  );
});

describe('sortableReadableDateString', () => {
  it('should format timestamp correctly', () => {
    const timestamp = 1_700_000_000_000; // 2023-11-14 22:13:20.000
    const result = sortableReadableDateString(timestamp);
    expect(result).toBe('20231114-221320-000');
    expect(result).toMatch(TIME_ID_BASE);
  });
});

describe('getUniqueTimeId', () => {
  it('should generate time ID with mocked timeOrigin', () => {
    const result = getUniqueTimeId();

    expect(result).toMatch(ID_PATTERNS.TIME_ID);
    expect(result).toMatch(ID_PATTERNS.GROUP_ID);
    expect(result).toBe('20231114-221320-000');
  });

  it('should generate new ID on each call (not idempotent)', () => {
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => callCount++);

    const id1 = getUniqueTimeId();
    const id2 = getUniqueTimeId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(ID_PATTERNS.TIME_ID);
    expect(id2).toMatch(ID_PATTERNS.TIME_ID);
  });
});

describe('getUniqueProcessThreadId', () => {
  it('should generate process/thread ID with correct format', () => {
    const result = getUniqueProcessThreadId();

    expect(result).toMatch(ID_PATTERNS.PROCESS_THREAD_ID);
    expect(result).toContain(`-10001-${threadId}`);
    expect(result).toStartWith('20231114-221320-000');
  });

  it('should generate new ID on each call (not idempotent)', () => {
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => callCount++);

    const id1 = getUniqueProcessThreadId();
    const id2 = getUniqueProcessThreadId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(ID_PATTERNS.PROCESS_THREAD_ID);
    expect(id2).toMatch(ID_PATTERNS.PROCESS_THREAD_ID);
  });
});

describe('getUniqueInstanceId', () => {
  it('should generate instance ID with correct format', () => {
    let counter = 0;
    const counterObj: Counter = {
      next: () => ++counter,
    };

    const result = getUniqueInstanceId(counterObj);

    expect(result).toMatch(ID_PATTERNS.INSTANCE_ID);
    expect(result).toStartWith('20231114-221320-000.');
    expect(result).toContain(`.10001.${threadId}.`);
    expect(result).toEndWith('.1');
  });

  it('should use counter to generate incrementing instance IDs', () => {
    let counter = 0;
    const counterObj: Counter = {
      next: () => ++counter,
    };

    const results = [
      getUniqueInstanceId(counterObj),
      getUniqueInstanceId(counterObj),
      getUniqueInstanceId(counterObj),
    ];

    expect(results[0]).toEndWith('.1');
    expect(results[1]).toEndWith('.2');
    expect(results[2]).toEndWith('.3');
  });

  it('should generate different IDs for different calls', () => {
    let counter = 0;
    const counterObj: Counter = {
      next: () => ++counter,
    };

    expect(getUniqueInstanceId(counterObj)).not.toBe(
      getUniqueInstanceId(counterObj),
    );
  });
});
