import { describe, expect, it } from 'vitest';
import { get42, isEven, untested } from './index';

describe('get42', () => {
  it('should return 42', async () => {
    expect(get42()).toBe(42);
  });
});

describe('isEven', () => {
  it('should return true for even number 42', async () => {
    expect(isEven(42)).toBe(true);
  });

  it.todo('should return false for odd number 1');
});

describe.todo('untested', () => {});
