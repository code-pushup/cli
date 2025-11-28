import { describe } from 'vitest';
import {
  hasNoNullableProps,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
  isRecord,
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

describe('isRecord', () => {
  it('should return true for an object', () => {
    expect(isRecord({ foo: 'bar' })).toBeTrue();
  });

  it('should return true for an empty object', () => {
    expect(isRecord({})).toBeTrue();
  });

  it('should return true for an array', () => {
    expect(isRecord([1, 2, 3])).toBeTrue();
  });

  it('should return false for a string', () => {
    expect(isRecord('foo')).toBeFalse();
  });

  it('should return false for null', () => {
    expect(isRecord(null)).toBeFalse();
  });

  it('should return false for undefined', () => {
    expect(isRecord(undefined)).toBeFalse();
  });
});
