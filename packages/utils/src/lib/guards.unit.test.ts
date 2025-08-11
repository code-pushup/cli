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
    expect(isPromiseFulfilledResult(result)).toBeTrue();
    expect(isPromiseRejectedResult(result)).toBeFalse();
  });

  it('should get rejected result', () => {
    const result = {
      status: 'rejected',
      reason: 'reason',
    } as PromiseSettledResult<unknown>;
    expect(isPromiseFulfilledResult(result)).toBeFalse();
    expect(isPromiseRejectedResult(result)).toBeTrue();
  });
});

describe('hasNoNullableProps', () => {
  it('should return true if object prop values are neither null nor undefined', () => {
    expect(hasNoNullableProps({ a: 42, b: 'foo', c: {}, d: [] })).toBeTrue();
  });

  it('should return false if some prop is null', () => {
    expect(hasNoNullableProps({ x: 42, y: null })).toBeFalse();
  });

  it('should return false if some prop is set to undefined', () => {
    expect(hasNoNullableProps({ x: undefined })).toBeFalse();
  });

  it('should return true for empty object', () => {
    expect(hasNoNullableProps({})).toBeTrue();
  });
});
