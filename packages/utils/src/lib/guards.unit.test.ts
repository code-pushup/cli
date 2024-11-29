import { describe } from 'vitest';
import { isPromiseFulfilledResult, isPromiseRejectedResult } from './guards.js';

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
