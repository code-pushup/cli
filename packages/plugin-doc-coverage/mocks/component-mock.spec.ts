import { describe, expect, it } from 'vitest';
import { DUMMY_FUNCTION, DUMMY_FUNCTION_2 } from './component-mock';

export function shouldnotBeHere() {
  return 'Hello World';
}

describe('component-mock', () => {
  it('should return Hello World', () => {
    expect(DUMMY_FUNCTION()).toBe('Hello World');
  });

  it('should return Hello World 2', () => {
    expect(DUMMY_FUNCTION_2()).toBe('Hello World 2');
  });
});
