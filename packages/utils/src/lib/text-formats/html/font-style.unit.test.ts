import { bold, code, italic } from './font-style.js';

describe('bold', () => {
  it('should return bold text', () => {
    const result = bold('Hello World');
    expect(result).toBe('<b>Hello World</b>');
  });
});

describe('italic', () => {
  it('should return italic text', () => {
    const result = italic('Hello World');
    expect(result).toBe('<i>Hello World</i>');
  });
});

describe('code', () => {
  it('should return code text', () => {
    const result = code('Hello World');
    expect(result).toBe('<code>Hello World</code>');
  });
});
