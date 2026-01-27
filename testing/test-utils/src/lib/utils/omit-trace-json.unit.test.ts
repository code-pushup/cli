import { omitTraceJson } from './omit-trace-json.js';

describe('omitTraceJson', () => {
  it('should return empty string unchanged', () => {
    expect(omitTraceJson('')).toBe('');
  });

  it('should return whitespace-only string unchanged', () => {
    expect(omitTraceJson('   \n\t  ')).toBe('   \n\t  ');
  });

  it('should return empty JSONL unchanged', () => {
    expect(omitTraceJson('\n\n')).toBe('\n\n');
  });

  it('should return minimal event unchanged', () => {
    const input = '{"name":"test"}\n';
    expect(omitTraceJson(input)).toBe(input);
  });

  it('should normalize pid field starting from 10001', () => {
    const result = omitTraceJson('{"pid":12345}\n');
    const parsed = JSON.parse(result.trim());
    expect(parsed.pid).toBe(10_001);
  });

  it('should normalize tid field starting from 1', () => {
    const result = omitTraceJson('{"tid":999}\n');
    const parsed = JSON.parse(result.trim());
    expect(parsed.tid).toBe(1);
  });

  it('should normalize ts field with default baseTimestampUs', () => {
    const result = omitTraceJson('{"ts":1234567890}\n');
    const parsed = JSON.parse(result.trim());
    expect(parsed.ts).toBe(1_700_000_005_000_000);
  });

  it('should normalize ts field with custom baseTimestampUs', () => {
    const customBase = 2_000_000_000_000_000;
    const result = omitTraceJson('{"ts":1234567890}\n', customBase);
    const parsed = JSON.parse(result.trim());
    expect(parsed.ts).toBe(customBase);
  });

  it('should normalize id2.local field starting from 0x1', () => {
    const result = omitTraceJson('{"id2":{"local":"0xabc123"}}\n');
    const parsed = JSON.parse(result.trim());
    expect(parsed.id2.local).toBe('0x1');
  });

  it('should preserve event order when timestamps are out of order', () => {
    const input =
      '{"ts":300,"name":"third"}\n{"ts":100,"name":"first"}\n{"ts":200,"name":"second"}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].name).toBe('third');
    expect(events[1].name).toBe('first');
    expect(events[2].name).toBe('second');
    expect(events[0].ts).toBe(1_700_000_005_000_002);
    expect(events[1].ts).toBe(1_700_000_005_000_000);
    expect(events[2].ts).toBe(1_700_000_005_000_001);
  });

  it('should preserve event order when PIDs are out of order', () => {
    const input =
      '{"pid":300,"name":"third"}\n{"pid":100,"name":"first"}\n{"pid":200,"name":"second"}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].name).toBe('third');
    expect(events[1].name).toBe('first');
    expect(events[2].name).toBe('second');
    expect(events[0].pid).toBe(10_003);
    expect(events[1].pid).toBe(10_001);
    expect(events[2].pid).toBe(10_002);
  });

  it('should preserve event order when TIDs are out of order', () => {
    const input =
      '{"tid":30,"name":"third"}\n{"tid":10,"name":"first"}\n{"tid":20,"name":"second"}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].name).toBe('third');
    expect(events[1].name).toBe('first');
    expect(events[2].name).toBe('second');
    expect(events[0].tid).toBe(3);
    expect(events[1].tid).toBe(1);
    expect(events[2].tid).toBe(2);
  });

  it('should preserve event order with mixed out-of-order fields', () => {
    const input =
      '{"pid":500,"tid":5,"ts":5000,"name":"e"}\n{"pid":100,"tid":1,"ts":1000,"name":"a"}\n{"pid":300,"tid":3,"ts":3000,"name":"c"}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events.map(e => e.name)).toEqual(['e', 'a', 'c']);
    expect(events[0].pid).toBe(10_003);
    expect(events[1].pid).toBe(10_001);
    expect(events[2].pid).toBe(10_002);
  });

  it('should not normalize non-number pid values', () => {
    const input = '{"pid":"string"}\n{"pid":null}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].pid).toBe('string');
    expect(events[1].pid).toBeNull();
  });

  it('should not normalize non-number tid values', () => {
    const input = '{"tid":"string"}\n{"tid":null}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].tid).toBe('string');
    expect(events[1].tid).toBeNull();
  });

  it('should not normalize non-number ts values', () => {
    const input = '{"ts":"string"}\n{"ts":null}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].ts).toBe('string');
    expect(events[1].ts).toBeNull();
  });

  it('should not normalize id2.local when id2 is missing', () => {
    const input = '{"name":"test"}\n';
    const result = omitTraceJson(input);
    const parsed = JSON.parse(result.trim());
    expect(parsed.id2).toBeUndefined();
  });

  it('should not normalize id2.local when id2 is not an object', () => {
    const input = '{"id2":"string"}\n{"id2":null}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].id2).toBe('string');
    expect(events[1].id2).toBeNull();
  });

  it('should not normalize id2.local when local is missing', () => {
    const input = '{"id2":{"other":"value"}}\n';
    const result = omitTraceJson(input);
    const parsed = JSON.parse(result.trim());
    expect(parsed.id2.local).toBeUndefined();
    expect(parsed.id2.other).toBe('value');
  });

  it('should not normalize id2.local when local is not a string', () => {
    const input = '{"id2":{"local":123}}\n{"id2":{"local":null}}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].id2.local).toBe(123);
    expect(events[1].id2.local).toBeNull();
  });

  it('should map duplicate values to same normalized value', () => {
    const input = '{"pid":100}\n{"pid":200}\n{"pid":100}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].pid).toBe(10_001);
    expect(events[1].pid).toBe(10_002);
    expect(events[2].pid).toBe(10_001);
  });

  it('should handle duplicate timestamps correctly', () => {
    const input = '{"ts":1000}\n{"ts":2000}\n{"ts":1000}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(events[0].ts).toBe(1_700_000_005_000_000);
    expect(events[1].ts).toBe(1_700_000_005_000_002);
    expect(events[2].ts).toBe(1_700_000_005_000_000);
  });

  it('should preserve other id2 properties when normalizing local', () => {
    const input =
      '{"id2":{"local":"0xabc","other":"value","nested":{"key":123}}}\n';
    const result = omitTraceJson(input);
    const parsed = JSON.parse(result.trim());
    expect(parsed.id2.local).toBe('0x1');
    expect(parsed.id2.other).toBe('value');
    expect(parsed.id2.nested).toEqual({ key: 123 });
  });

  it('should map multiple id2.local values to incremental hex', () => {
    const input =
      '{"id2":{"local":"0xabc"}}\n{"id2":{"local":"0xdef"}}\n{"id2":{"local":"0x123"}}\n';
    const result = omitTraceJson(input);
    const events = result
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    const locals = events.map(e => e.id2.local).sort();
    expect(locals).toEqual(['0x1', '0x2', '0x3']);
  });

  it('should output valid JSONL with trailing newline', () => {
    const result = omitTraceJson('{"pid":123}\n');
    expect(result).toMatch(/\n$/);
    expect(() => JSON.parse(result.trim())).not.toThrow();
  });
});
