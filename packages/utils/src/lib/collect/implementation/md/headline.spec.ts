import { headline } from './headline';

describe('headline', () => {
  it('should return level 1 headline by default', () => {
    const result = headline('Hello World');
    expect(result).toBe('# Hello World');
  });

  it('should return level 2 headline when hierarchy set to 2', () => {
    const result = headline('Hello World', 2);
    expect(result).toBe('## Hello World');
  });

  it('should return level 3 headline when hierarchy set to 3', () => {
    const result = headline('Hello World', 3);
    expect(result).toBe('### Hello World');
  });

  it('should return level 4 headline when hierarchy set to 4', () => {
    const result = headline('Hello World', 4);
    expect(result).toBe('#### Hello World');
  });

  it('should return level 5 headline when hierarchy set to 5', () => {
    const result = headline('Hello World', 5);
    expect(result).toBe('##### Hello World');
  });

  it('should return level 6 headline when hierarchy set to 6', () => {
    const result = headline('Hello World', 6);
    expect(result).toBe('###### Hello World');
  });

  it('should handle empty text', () => {
    const result = headline('', 3);
    expect(result).toBe('### ');
  });
});
