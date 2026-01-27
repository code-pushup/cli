import ansis from 'ansis';
import type Details from 'lighthouse/types/lhr/audit-details';
import { logger } from '@code-pushup/utils';
import {
  type SimpleItemValue,
  formatTableItemPropertyValue,
  parseNodeValue,
  parseSimpleItemValue,
  parseTableItemPropertyValue,
} from './item-value.js';

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
    expect(parseSimpleItemValue(false)).toBeFalse();
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
    expect(parseTableItemPropertyValue(false)).toBeFalse();
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

  it('should parse value item subitems to empty string and log implemented', () => {
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
    ).toBe('');

    expect(logger.debug).toHaveBeenCalledWith(
      `Value type ${ansis.bold('subitems')} is not implemented`,
    );
  });

  it('should parse value item debugdata to empty string and log implemented', () => {
    expect(parseTableItemPropertyValue({ type: 'debugdata' })).toBe('');
    expect(logger.debug).toHaveBeenCalledWith(
      `Value type ${ansis.bold('debugdata')} is not implemented`,
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
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const stringOfLength = (length: number, postfix = ''): string => {
    const maxLength = length - postfix.length;
    let result = '';
    // eslint-disable-next-line functional/no-loop-statements
    for (let i = 0; i < maxLength; i++) {
      result += alphabet.at((alphabet.length - 1) % i);
    }

    if (postfix) {
      result += postfix;
    }

    return result;
  };

  it('should format undefined to empty string', () => {
    expect(formatTableItemPropertyValue(undefined)).toBe('');
  });

  it('should format primitive string value without extra type format', () => {
    expect(formatTableItemPropertyValue('42   ')).toBe('42');
  });

  it('should format primitive number', () => {
    expect(formatTableItemPropertyValue(42.213_123_123)).toBe(42.213_123_123);
  });

  it('should format primitive number value have no floating numbers if all are zeros', () => {
    expect(formatTableItemPropertyValue(42)).toBe(42);
  });

  it('should format primitive boolean value', () => {
    expect(formatTableItemPropertyValue(false)).toBeFalse();
  });

  it('should forward non primitive value directly if no format is provided', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'debugdata', value: '42' },
        undefined,
      ),
    ).toStrictEqual({ type: 'debugdata', value: '42' });
  });

  it('should format value based on itemValueFormat "bytes"', () => {
    expect(formatTableItemPropertyValue('100000', 'numeric')).toBe('100000');
  });

  it('should format value based on itemValueFormat "code"', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'code', value: '<body><h1>Code Pushup</h1></body>' },
        'code',
      ),
    ).toBe('<code><body><h1>Code Pushup</h1></body></code>');
  });

  it('should format value based on itemValueFormat "link"', () => {
    expect(
      formatTableItemPropertyValue(
        {
          type: 'link',
          url: 'https://code-pushup.dev',
          text: 'code-pushup.dev',
        },
        'link',
      ),
    ).toBe('<a href="https://code-pushup.dev">code-pushup.dev</a>');
  });

  it('should format value based on itemValueFormat "url"', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'url', value: 'https://code-pushup.dev' },
        'url',
      ),
    ).toBe('<a href="https://code-pushup.dev">https://code-pushup.dev</a>');
  });

  it('should format value based on itemValueFormat "timespanMs"', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'numeric', value: 2142 },
        'timespanMs',
      ),
    ).toBe('2.142 s');
  });

  it('should format value based on itemValueFormat "ms"', () => {
    expect(
      formatTableItemPropertyValue({ type: 'numeric', value: 2142 }, 'ms'),
    ).toBe('2.142 s');
  });

  it('should format value based on itemValueFormat "node"', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'node', selector: 'h1 > span' },
        'node',
      ),
    ).toBe('h1 > span');
  });

  it('should format value based on itemValueFormat "source-location"', () => {
    expect(
      formatTableItemPropertyValue(
        {
          type: 'source-location',
          url: 'https://code-pushup.dev',
        } as Details.ItemValue,
        'source-location',
      ),
    ).toBe('https://code-pushup.dev');
  });

  it('should format value based on itemValueFormat "source-location" to a length of 200 and add "..."', () => {
    const formattedStr = formatTableItemPropertyValue(
      {
        type: 'source-location',
        url: stringOfLength(210, 'https://code-pushup.dev'),
      } as Details.ItemValue,
      'source-location',
    ) as string;

    expect(formattedStr.length).toBeLessThanOrEqual(200);
    expect(formattedStr.slice(-1)).toBe('…');
  });

  it('should format value based on itemValueFormat "numeric" as int', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'numeric', value: 42 } as Details.ItemValue,
        'numeric',
      ),
    ).toBe('42');
  });

  it('should format value based on itemValueFormat "numeric" as float', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'numeric', value: 42.1 } as Details.ItemValue,
        'numeric',
      ),
    ).toBe('42.1');
  });

  it('should format value based on itemValueFormat "numeric" as int if float has only 0 post comma', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'numeric', value: Number('42.0') } as Details.ItemValue,
        'numeric',
      ),
    ).toBe('42');
  });

  it('should format value based on itemValueFormat "text"', () => {
    expect(
      formatTableItemPropertyValue(
        {
          type: 'url',
          value: 'https://github.com/code-pushup/cli/blob/main/README.md',
        } as Details.ItemValue,
        'text',
      ),
    ).toBe('https://github.com/code-pushup/cli/blob/main/README.md');
  });

  it('should format value based on itemValueFormat "text" to a length of 500 and add "..."', () => {
    const formattedStr = formatTableItemPropertyValue(
      {
        type: 'url',
        value: stringOfLength(510, 'https://github.com/'),
      } as Details.ItemValue,
      'text',
    ) as string;

    expect(formattedStr.length).toBeLessThanOrEqual(500);
    expect(formattedStr.slice(-1)).toBe('…');
  });

  it('should format value based on itemValueFormat "multi"', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'numeric', value: 42 } as Details.ItemValue,
        'multi',
      ),
    ).toBe('');

    expect(logger.debug).toHaveBeenCalledWith(
      `Format type ${ansis.bold('multi')} is not implemented`,
    );
  });

  it('should format value based on itemValueFormat "thumbnail"', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'numeric', value: 42 } as Details.ItemValue,
        'thumbnail',
      ),
    ).toBe('');
    expect(logger.debug).toHaveBeenCalledWith(
      `Format type ${ansis.bold('thumbnail')} is not implemented`,
    );
  });

  it('should not format value based on itemValueFormat type that is unsupported', () => {
    expect(
      formatTableItemPropertyValue(
        { type: 'unsupported' as any, value: 43 },
        'unsupported' as Details.ItemValueType,
      ),
    ).toStrictEqual({ type: 'unsupported', value: 43 });
  });
});
