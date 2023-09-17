import { li } from './list';

describe('li', () => {
  it('should return an unordered list item by default', () => {
    const result = li('Hello World');
    expect(result).toBe('- Hello World');
  });

  it('should return a checkbox list item when order set to "checkbox"', () => {
    const result = li('Hello World', 'checkbox');
    expect(result).toBe('- [ ] Hello World');
  });

  it('should handle empty text', () => {
    const result = li('');
    expect(result).toBe('- ');
  });

  it('should handle empty text with checkbox order', () => {
    const result = li('', 'checkbox');
    expect(result).toBe('- [ ] ');
  });

  it('should correctly handle special characters', () => {
    const result = li('Hello *World*', 'checkbox');
    expect(result).toBe('- [ ] Hello *World*');
  });
});
