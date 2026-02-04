import {
  issueSourceSchema,
  sourceFileLocationSchema,
  sourceUrlLocationSchema,
} from './source.js';

describe('sourceFileLocationSchema', () => {
  it('should accept valid file location with position', () => {
    expect(() =>
      sourceFileLocationSchema.parse({
        file: 'src/index.ts',
        position: { startLine: 10, endLine: 15 },
      }),
    ).not.toThrow();
  });

  it('should accept file location without position', () => {
    expect(() =>
      sourceFileLocationSchema.parse({ file: 'src/utils.ts' }),
    ).not.toThrow();
  });

  it('should reject empty file path', () => {
    expect(() => sourceFileLocationSchema.parse({ file: '' })).toThrow(
      'Too small',
    );
  });
});

describe('sourceUrlLocationSchema', () => {
  it('should accept valid URL location with all fields', () => {
    expect(() =>
      sourceUrlLocationSchema.parse({
        url: 'https://example.com/page',
        snippet: '<img src="logo.png">',
        selector: 'img.logo',
      }),
    ).not.toThrow();
  });

  it('should accept URL location with only required url field', () => {
    expect(() =>
      sourceUrlLocationSchema.parse({ url: 'https://example.com' }),
    ).not.toThrow();
  });

  it('should accept URL location with snippet only', () => {
    expect(() =>
      sourceUrlLocationSchema.parse({
        url: 'https://example.com/dashboard',
        snippet: '<button disabled>Submit</button>',
      }),
    ).not.toThrow();
  });

  it('should accept URL location with selector only', () => {
    expect(() =>
      sourceUrlLocationSchema.parse({
        url: 'https://example.com/form',
        selector: '#submit-btn',
      }),
    ).not.toThrow();
  });

  it('should reject invalid URL', () => {
    expect(() =>
      sourceUrlLocationSchema.parse({ url: 'not-a-valid-url' }),
    ).toThrow('Invalid URL');
  });

  it('should reject missing URL', () => {
    expect(() =>
      sourceUrlLocationSchema.parse({ snippet: '<div>No URL provided</div>' }),
    ).toThrow('Invalid input');
  });
});

describe('issueSourceSchema', () => {
  it('should accept file-based source', () => {
    expect(() =>
      issueSourceSchema.parse({
        file: 'src/app.ts',
        position: { startLine: 1 },
      }),
    ).not.toThrow();
  });

  it('should accept URL-based source', () => {
    expect(() =>
      issueSourceSchema.parse({
        url: 'https://example.com',
        selector: '#main',
      }),
    ).not.toThrow();
  });

  it('should reject source with neither file nor url', () => {
    expect(() =>
      issueSourceSchema.parse({ position: { startLine: 1 } }),
    ).toThrow('Invalid input');
  });
});
