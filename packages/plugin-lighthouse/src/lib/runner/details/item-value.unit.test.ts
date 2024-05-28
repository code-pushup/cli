import { describe, expect, it } from 'vitest';
import {
  SimpleItemValue,
  formatTableItemPropertyValue,
  parseNodeValue,
  parseSimpleItemValue,
  parseTableItemPropertyValue,
} from './item-value';

describe('parseNodeValue', () => {
  it('should parse selector of node', () => {
    expect(parseNodeValue({ type: 'node', selector: 'h1 > span.icon' })).toBe(
      'h1 > span.icon',
    );
  });

  it('should parse empty node', () => {
    expect(parseNodeValue(undefined)).toBe('');
  });
});

describe('parseSimpleItemValue', () => {
  it('should parse primitive ItemValue type string', () => {
    expect(parseSimpleItemValue('42')).toBe('42');
  });

  it('should parse primitive ItemValue type number', () => {
    expect(parseSimpleItemValue(42)).toBe(42);
  });

  it('should parse primitive ItemValue type boolean', () => {
    expect(parseSimpleItemValue(false)).toBe(false);
  });

  it('should parse ObjectItemValue ItemValue type boolean', () => {
    expect(parseSimpleItemValue({ type: 'numeric', value: 42 })).toBe(42);
  });

  it('should parse IcuMessage', () => {
    expect(
      parseSimpleItemValue({
        value: { i18nId: 'i18nId-42', formattedDefault: '42' },
      } as any),
    ).toBe('42');
  });
});

describe('parseTableItemPropertyValue', () => {
  it('should parse undefined', () => {
    expect(parseTableItemPropertyValue(undefined)).toBe('');
  });

  it('should parse primitive string value', () => {
    expect(parseTableItemPropertyValue('42')).toBe('42');
  });

  it('should parse primitive number float value', () => {
    expect(parseTableItemPropertyValue(42.21)).toBe(42.21);
  });

  it('should parse primitive number int value', () => {
    expect(parseTableItemPropertyValue(42)).toBe(42);
  });

  it('should parse primitive boolean value', () => {
    expect(parseTableItemPropertyValue(false)).toBe(false);
  });

  it('should parse value item code', () => {
    expect(
      parseTableItemPropertyValue({ type: 'code', value: 'const num = 42;' }),
    ).toBe('const num = 42;');
  });

  it('should parse value item url', () => {
    expect(
      parseTableItemPropertyValue({
        type: 'url',
        value: 'https://www.code-pushup.dev',
      }),
    ).toBe('https://www.code-pushup.dev');
  });

  it('should parse value item link', () => {
    expect(
      parseTableItemPropertyValue({
        type: 'link',
        url: 'https://www.code-pushup.dev',
        text: 'Code Pushup',
      }),
    ).toEqual({
      type: 'link',
      url: 'https://www.code-pushup.dev',
      text: 'Code Pushup',
    });
  });

  it('should parse value item node', () => {
    expect(
      parseTableItemPropertyValue({ type: 'node', selector: 'h1 > span.icon' }),
    ).toBe('h1 > span.icon');
  });

  it('should parse value item numeric', () => {
    expect(parseTableItemPropertyValue({ type: 'numeric', value: 42 })).toBe(
      42,
    );
  });

  it('should parse value item source-location', () => {
    expect(
      parseTableItemPropertyValue({
        type: 'code',
        value: 'Legible text',
      }),
    ).toBe('Legible text');
  });

  it('should parse value item subitems', () => {
    expect(
      parseTableItemPropertyValue({
        type: 'subitems',
        items: [
          {
            url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2',
            mainThreadTime: 0,
            blockingTime: 0,
            transferSize: 22_826,
            tbtImpact: 0,
          },
          {
            url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPb94C-s0.woff2',
            mainThreadTime: 0,
            blockingTime: 0,
            transferSize: 18_380,
            tbtImpact: 0,
          },
        ],
      }),
    ).toBe('subitems');
  });

  it('should parse value item debugdata', () => {
    expect(parseTableItemPropertyValue({ type: 'debugdata' })).toBe(
      'debugdata',
    );
  });

  it('should parse value item IcuMessage', () => {
    expect(
      parseTableItemPropertyValue({
        value: { i18nId: 'i18nId-42', formattedDefault: 'IcuMessageValue' },
      } as SimpleItemValue),
    ).toBe('IcuMessageValue');
  });
});

describe('formatTableItemPropertyValue', () => {
  it('should parse undefined', () => {
    expect(formatTableItemPropertyValue(undefined)).toBe('');
  });

  it('should parse primitive string value without extra type format', () => {
    expect(formatTableItemPropertyValue('42   ')).toBe('42');
  });

  it('should parse primitive number', () => {
    expect(formatTableItemPropertyValue(42.213_123_123)).toBe(42.213_123_123);
  });

  it('should parse primitive number value have no floating numbers if all are zeros', () => {
    expect(formatTableItemPropertyValue(42)).toBe(42);
  });

  it('should parse primitive boolean value', () => {
    expect(formatTableItemPropertyValue(false)).toBe(false);
  });
});
