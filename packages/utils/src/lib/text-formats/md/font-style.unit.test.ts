import { style } from './font-style';

describe('style', () => {
  it('should return bold text by default', () => {
    const result = style('Hello World');
    expect(result).toBe('**Hello World**');
  });

  it('should return italic text when styles set to ["italic"]', () => {
    const result = style('Hello World', ['italic']);
    expect(result).toBe('_Hello World_');
  });

  it('should return strike-through text when styles set to ["strike-through"]', () => {
    const result = style('Hello World', ['strike-through']);
    expect(result).toBe('~Hello World~');
  });

  it('should return bold and strike-through text when styles set to ["bold", "strike-through"]', () => {
    const result = style('Hello World', ['bold', 'strike-through']);
    expect(result).toBe('~**Hello World**~');
  });

  it('should return text with mixed styles', () => {
    const result = style('Hello World', ['italic', 'bold', 'strike-through']);
    expect(result).toBe('~**_Hello World_**~');
  });

  it('should return unchanged text for an empty styles array', () => {
    const result = style('Hello World', []);
    expect(result).toBe('Hello World');
  });

  it('should apply formatting on empty string', () => {
    const result = style('', ['italic', 'bold']);
    expect(result).toBe('**__**');
  });
});
