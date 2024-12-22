import { describe } from 'vitest';
import {
  hasNoNullableProps,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
} from './guards.js';

describe('promise-result', () => {
  it('should get fulfilled result', () => {
    const result = {
      status: 'fulfilled',
      value: 'value',
    } as PromiseSettledResult<unknown>;
    expect(isPromiseFulfilledResult(result)).toBe(true);
    expect(isPromiseRejectedResult(result)).toBe(false);
  });

  it('should get rejected result', () => {
    const result = {
      status: 'rejected',
      reason: 'reason',
    } as PromiseSettledResult<unknown>;
    expect(isPromiseFulfilledResult(result)).toBe(false);
    expect(isPromiseRejectedResult(result)).toBe(true);
  });
});

describe('hasNoNullableProps', () => {
  it('should return true if object prop values are neither null nor undefined', () => {
    expect(hasNoNullableProps({ a: 42, b: 'foo', c: {}, d: [] })).toBe(true);
  });

  it('should return false if some prop is null', () => {
    expect(hasNoNullableProps({ x: 42, y: null })).toBe(false);
  });

  it('should return false if some prop is set to undefined', () => {
    expect(hasNoNullableProps({ x: undefined })).toBe(false);
  });

  it('should return true for empty object', () => {
    expect(hasNoNullableProps({})).toBe(true);
  });
});
