import { getUrlIdentifier, normalizeUrlInput } from './plugin-url-config.js';

describe('getUrlIdentifier', () => {
  it.each([
    ['https://example.com', 'example.com'],
    ['https://example.com/', 'example.com'],
    ['http://example.com', 'example.com'],
    ['https://example.com/about', 'example.com/about'],
    ['https://example.com/about/', 'example.com/about/'],
    ['https://example.com/docs/api', 'example.com/docs/api'],
    ['https://example.com/page?q=test', 'example.com/page'],
    ['https://example.com/page#section', 'example.com/page'],
    ['https://example.com/page?q=test#section', 'example.com/page'],
    ['https://example.com:3000', 'example.com:3000'],
    ['https://example.com:3000/api', 'example.com:3000/api'],
    ['https://www.example.com', 'www.example.com'],
    ['https://api.example.com/v1', 'api.example.com/v1'],
    ['not-a-url', 'not-a-url'],
    ['just-text', 'just-text'],
    ['', ''],
    ['https://localhost', 'localhost'],
    ['https://127.0.0.1:8080/test', '127.0.0.1:8080/test'],
  ])('should convert %j to %j', (input, expected) => {
    expect(getUrlIdentifier(input)).toBe(expected);
  });
});

describe('normalizeUrlInput', () => {
  describe('string input', () => {
    it('should normalize single URL string', () => {
      expect(normalizeUrlInput('https://example.com')).toEqual({
        urls: ['https://example.com'],
        context: {
          urlCount: 1,
          weights: { 1: 1 },
        },
      });
    });
  });

  describe('array input', () => {
    it('should normalize array of URLs', () => {
      expect(
        normalizeUrlInput(['https://example.com', 'https://example.com/about']),
      ).toEqual({
        urls: ['https://example.com', 'https://example.com/about'],
        context: {
          urlCount: 2,
          weights: { 1: 1, 2: 1 },
        },
      });
    });

    it('should handle empty array', () => {
      expect(normalizeUrlInput([])).toEqual({
        urls: [],
        context: {
          urlCount: 0,
          weights: {},
        },
      });
    });

    it('should handle single URL in array', () => {
      expect(normalizeUrlInput(['https://example.com'])).toEqual({
        urls: ['https://example.com'],
        context: {
          urlCount: 1,
          weights: { 1: 1 },
        },
      });
    });
  });

  describe('weighted object input', () => {
    it('should normalize weighted URLs', () => {
      expect(
        normalizeUrlInput({
          'https://example.com': 2,
          'https://example.com/about': 3,
          'https://example.com/contact': 1,
        }),
      ).toEqual({
        urls: [
          'https://example.com',
          'https://example.com/about',
          'https://example.com/contact',
        ],
        context: {
          urlCount: 3,
          weights: { 1: 2, 2: 3, 3: 1 },
        },
      });
    });

    it('should handle single weighted URL', () => {
      expect(normalizeUrlInput({ 'https://example.com': 5 })).toEqual({
        urls: ['https://example.com'],
        context: {
          urlCount: 1,
          weights: { 1: 5 },
        },
      });
    });

    it('should preserve zero weights', () => {
      expect(
        normalizeUrlInput({
          'https://example.com': 2,
          'https://example.com/about': 0,
        }),
      ).toEqual({
        urls: ['https://example.com', 'https://example.com/about'],
        context: {
          urlCount: 2,
          weights: { 1: 2, 2: 0 },
        },
      });
    });

    it('should handle empty object', () => {
      expect(normalizeUrlInput({})).toEqual({
        urls: [],
        context: {
          urlCount: 0,
          weights: {},
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with special characters', () => {
      const result = normalizeUrlInput({
        'https://example.com/path?query=test&foo=bar': 2,
        'https://example.com/path#section': 1,
      });

      expect(result.urls).toEqual([
        'https://example.com/path?query=test&foo=bar',
        'https://example.com/path#section',
      ]);
      expect(result.context.weights).toEqual({ 1: 2, 2: 1 });
    });

    it('should handle numeric weights including decimals', () => {
      const result = normalizeUrlInput({
        'https://example.com': 1.5,
        'https://example.com/about': 2.7,
      });

      expect(result.context.weights).toEqual({ 1: 1.5, 2: 2.7 });
    });
  });
});
