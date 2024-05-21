import { bold, code, italic, strikeThrough } from './font-style';

describe('bold', () => {
  it('should return bold text', () => {
    const result = bold('Hello World');
    expect(result).toBe('**Hello World**');
  });
});

describe('italic', () => {
  it('should return italic text', () => {
    const result = italic('Hello World');
    expect(result).toBe('_Hello World_');
  });
});

describe('strike-through', () => {
  it('should return strike-through text', () => {
    const result = strikeThrough('Hello World');
    expect(result).toBe('~Hello World~');
  });
});

describe('code', () => {
  it('should return code text', () => {
    const result = code('Hello World');
    expect(result).toBe('`Hello World`');
  });
});
