import { describe, expect, it } from 'vitest';
import {
  formatArrayToJSArray,
  formatArrayToLinesOfJsString,
  normalizeExecutableCode,
  normalizeItemOrArray,
} from './utils';

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

  it('should return undefined for undefined values', () => {
    expect(formatArrayToJSArray(undefined)).toBeUndefined();
  });
});

describe('formatArrayToLinesOfJsString', () => {
  it('should return lines as JS', () => {
    expect(
      formatArrayToLinesOfJsString([`import plugin from "../mx-plugin";`]),
    ).toMatchInlineSnapshot(
      `
        "import plugin from "../mx-plugin";"
      `,
    );
  });

  it('should return lines as JS with normalized quotes', () => {
    expect(
      formatArrayToLinesOfJsString([
        `import { CoreConfig } from '@code-pushup/models';`,
        `import plugin from "../mx-plugin";`,
      ]),
    ).toMatchInlineSnapshot(
      `
        "import { CoreConfig } from "@code-pushup/models";
        import plugin from "../mx-plugin";"
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

describe('normalizeExecutableCode', () => {
  it('should turn strings into arrays', () => {
    expect(
      normalizeExecutableCode({
        fileImports: 'import { CoreConfig } from "@code-pushup/models";',
        codeStrings: 'myPlugin()',
      }),
    ).toStrictEqual({
      fileImports: ['import { CoreConfig } from "@code-pushup/models";'],
      codeStrings: ['myPlugin()'],
    });
  });

  it('should keep arrays', () => {
    expect(
      normalizeExecutableCode({
        fileImports: ['import { CoreConfig } from "@code-pushup/models";'],
        codeStrings: ['myPlugin()'],
      }),
    ).toStrictEqual({
      fileImports: ['import { CoreConfig } from "@code-pushup/models";'],
      codeStrings: ['myPlugin()'],
    });
  });
});

describe('normalizeItemOrArray', () => {
  it('should turn string into string array', () => {
    expect(normalizeItemOrArray('myPlugin()')).toStrictEqual(['myPlugin()']);
  });

  it('should keep string array', () => {
    expect(normalizeItemOrArray('myPlugin()')).toStrictEqual(['myPlugin()']);
  });
});
