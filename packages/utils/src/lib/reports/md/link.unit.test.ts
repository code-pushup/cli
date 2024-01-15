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

  it('should return an empty formatted link for empty string', () => {
    const result = link('');
    expect(result).toBe('[]()');
  });

  it('should insert link as text for empty string', () => {
    const result = link('https://example.com', '');
    expect(result).toBe('[https://example.com](https://example.com)');
  });

  it('should insert link as text for undefined text', () => {
    const result = link('https://example.com', undefined);
    expect(result).toBe('[https://example.com](https://example.com)');
  });

  it('should include special characters', () => {
    const result = link('https://example.com/query?a=b&c=d', 'Query Example');
    expect(result).toBe('[Query Example](https://example.com/query?a=b&c=d)');
  });
});
