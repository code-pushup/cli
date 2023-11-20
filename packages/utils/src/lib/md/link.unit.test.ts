import { link } from './link';

describe('link', () => {
  it('should return a markdown link with provided href and text', () => {
    const result = link('https://example.com', 'Example');
    expect(result).toBe('[Example](https://example.com)');
  });

  it('should return a markdown link with href only when text is not provided', () => {
    const result = link('https://example.com');
    expect(result).toBe('[https://example.com](https://example.com)');
  });

  it('should handle empty string as href', () => {
    const result = link('');
    expect(result).toBe('[]()');
  });

  it('should handle empty string as text', () => {
    const result = link('https://example.com', '');
    expect(result).toBe('[https://example.com](https://example.com)');
  });

  it('should handle undefined as text', () => {
    const result = link('https://example.com', undefined);
    expect(result).toBe('[https://example.com](https://example.com)');
  });

  it('should correctly handle special characters', () => {
    const result = link('https://example.com/query?a=b&c=d', 'Query Example');
    expect(result).toBe('[Query Example](https://example.com/query?a=b&c=d)');
  });
});
