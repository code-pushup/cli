import { describe, expect, it } from 'vitest';
import { formatArrayToJSArray, formatArrayToLinesOfJsString } from './utils';

describe('formatArrayToJSArray', () => {
  it('should return array as JS', () => {
    expect(
      formatArrayToJSArray(['plugin1()', 'plugin2()']),
    ).toMatchInlineSnapshot(
      `
        "[plugin1(),
        plugin2()]"
      `,
    );
  });

  it('should return empty array as JS for empty items', () => {
    expect(formatArrayToJSArray([])).toMatchInlineSnapshot('"[]"');
  });

  it('should return undefined for nullish values', () => {
    expect(formatArrayToJSArray()).toBeUndefined();
  });
});

describe('formatArrayToLinesOfJsString', () => {
  it('should return lines as JS', () => {
    expect(
      formatArrayToLinesOfJsString([
        "import { CoreConfig } from '@code-pushup/models';",
        "import plugin from '../mx-plugin';",
      ]),
    ).toMatchInlineSnapshot(
      `
        "import { CoreConfig } from '@code-pushup/models';
        import plugin from '../mx-plugin';"
      `,
    );
  });

  it('should return undefined for empty items', () => {
    expect(formatArrayToLinesOfJsString([])).toBeUndefined();
  });

  it('should return undefined for nullish values', () => {
    expect(formatArrayToLinesOfJsString()).toBeUndefined();
  });
});
