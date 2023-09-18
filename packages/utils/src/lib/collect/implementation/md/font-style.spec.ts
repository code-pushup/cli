import { style } from './font-style';

describe('style', () => {
  it('should return bold text by default', () => {
    const result = style('Hello World');
    expect(result).toBe('**Hello World**');
  });

  it('should return italic text when styles set to ["i"]', () => {
    const result = style('Hello World', ['i']);
    expect(result).toBe('_Hello World_');
  });

  it('should return strike-through text when styles set to ["s"]', () => {
    const result = style('Hello World', ['s']);
    expect(result).toBe('~Hello World~');
  });

  it('should return bold and strike-through text when styles set to ["b", "s"]', () => {
    const result = style('Hello World', ['b', 's']);
    expect(result).toBe('~**Hello World**~');
  });

  it('should return text with mixed styles', () => {
    const result = style('Hello World', ['i', 'b', 's']);
    expect(result).toBe('~**_Hello World_**~');
  });

  it('should handle empty styles array', () => {
    const result = style('Hello World', []);
    expect(result).toBe('Hello World');
  });

  it('should handle empty text', () => {
    const result = style('', ['i', 'b']);
    expect(result).toBe('**__**');
  });
});
