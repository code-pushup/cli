import { expect } from 'vitest';
import { ui } from './logging';

describe('ui', () => {
  it('should return singleton', () => {
    expect(ui()).toBe(ui());
  });
});
