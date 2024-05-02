import { describe, expect, it } from 'vitest';
import { TableRow } from '@code-pushup/models';
import {
  apostrophize,
  capitalize,
  countOccurrences,
  deepClone,
  distinct,
  factorOf,
  fromJsonLines,
  getColumnAlignmentForIndex,
  getColumnAlignmentForKey,
  getColumnAlignments,
  objectFromEntries,
  objectToCliArgs,
  objectToEntries,
  objectToKeys,
  rowToStringArray,
  tableToStringArray,
  toArray,
  toJsonLines,
  toNumberPrecision,
  toOrdinal,
  toUnixPath,
} from './transform';

describe('toArray', () => {
  it('should transform non-array value into array with single value', () => {
    expect(toArray('src/**/*.ts')).toEqual(['src/**/*.ts']);
  });

  it('should leave array value unchanged', () => {
    expect(toArray(['*.ts', '*.js'])).toEqual(['*.ts', '*.js']);
  });
});

describe('objectToKeys', () => {
  it('should transform object into array of keys', () => {
    const keys: 'prop1'[] = objectToKeys({ prop1: 1 });
    expect(keys).toEqual(['prop1']);
  });

  it('should transform empty object into empty array', () => {
    const keys: never[] = objectToKeys({});
    expect(keys).toEqual([]);
  });
});

describe('objectFromEntries', () => {
  it('should transform key-value pairs to an object', () => {
    expect(
      objectFromEntries([
        ['jan', 'January'],
        ['feb', 'February'],
      ]),
    ).toEqual({ jan: 'January', feb: 'February' });
  });

  it('should transform key-value pairs with numeric keys to an object', () => {
    expect(
      objectFromEntries([
        [1, 'January'],
        [2, 'February'],
      ]),
    ).toEqual({ 1: 'January', 2: 'February' });
  });

  it('should transform empty entries to empty object', () => {
    expect(objectFromEntries([])).toEqual({});
  });
});

describe('objectToEntries', () => {
  it('should transform object into array of entries', () => {
    const keys: ['prop1', number][] = objectToEntries({ prop1: 1 });
    expect(keys).toEqual([['prop1', 1]]);
  });

  it('should transform empty object into empty array', () => {
    const keys: [never, never][] = objectToEntries({});
    expect(keys).toEqual([]);
  });
});

describe('countOccurrences', () => {
  it('should return record with counts for each item', () => {
    expect(
      countOccurrences(['error', 'warning', 'error', 'error', 'warning']),
    ).toEqual({ error: 3, warning: 2 });
  });

  it('should return empty record for no matches', () => {
    expect(countOccurrences([])).toEqual({});
  });
});

describe('distinct', () => {
  it('should remove duplicate strings from array', () => {
    expect(
      distinct([
        'no-unused-vars',
        'no-invalid-regexp',
        'no-unused-vars',
        'no-invalid-regexp',
        '@typescript-eslint/no-unused-vars',
      ]),
    ).toEqual([
      'no-unused-vars',
      'no-invalid-regexp',
      '@typescript-eslint/no-unused-vars',
    ]);
  });
});

describe('deepClone', () => {
  it('should clone the object with nested array with objects, with null and undefined properties', () => {
    const obj = {
      a: 1,
      b: 2,
      c: [
        { d: 3, e: 4 },
        { f: 5, g: 6 },
      ],
      d: null,
      e: undefined,
    };
    const cloned = deepClone(obj);
    expect(cloned).toStrictEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.c).not.toBe(obj.c);
    expect(cloned.c[0]).not.toBe(obj.c[0]);
    expect(cloned.c[1]).not.toBe(obj.c[1]);
    expect(cloned.d).toBe(obj.d);
    expect(cloned.e).toBe(obj.e);
  });
});

describe('factorOf', () => {
  it.each([
    [[], 1],
    [[0, 0], 0],
    [[0, 1], 0.5],
    [[1, 1], 1],
  ])('should return correct factor items', (items, factor) => {
    expect(factorOf(items, i => i < 1)).toEqual(factor);
  });
});

describe('objectToCliArgs', () => {
  it('should handle the "_" argument as script', () => {
    const params = { _: 'bin.js' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js']);
  });

  it('should handle the "_" argument with multiple values', () => {
    const params = { _: ['bin.js', '--help'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js', '--help']);
  });

  it('should handle shorthands arguments', () => {
    const params = {
      e: `test`,
    };
    const result = objectToCliArgs(params);
    expect(result).toEqual([`-e="${params.e}"`]);
  });

  it('should handle string arguments', () => {
    const params = { name: 'Juanita' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--name="Juanita"']);
  });

  it('should handle number arguments', () => {
    const params = { parallel: 5 };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--parallel=5']);
  });

  it('should handle boolean arguments', () => {
    const params = { progress: true };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--progress']);
  });

  it('should handle negated boolean arguments', () => {
    const params = { progress: false };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--no-progress']);
  });

  it('should handle array of string arguments', () => {
    const params = { format: ['json', 'md'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--format="json"', '--format="md"']);
  });

  it('should throw error for unsupported type', () => {
    const params = { unsupported: undefined as any };
    expect(() => objectToCliArgs(params)).toThrow('Unsupported type');
  });
});

describe('toUnixPath', () => {
  it.each([
    ['main.ts', 'main.ts'],
    ['src/main.ts', 'src/main.ts'],
    ['../../relative/unix/path/index.ts', '../../relative/unix/path/index.ts'],
    [
      '..\\..\\relative\\windows\\path\\index.ts',
      '../../relative/windows/path/index.ts',
    ],
  ])('should transform "%s" to valid slug "%s"', (path, unixPath) => {
    expect(toUnixPath(path)).toBe(unixPath);
  });
});

describe('JSON lines format', () => {
  const head = { label: 'head' };
  const body = { label: 'body' };

  describe('fromJsonLines', () => {
    it('should transform JSON lines to JSON', () => {
      const jsonLines = [head, body]
        .map(label => JSON.stringify(label))
        .join('\n');

      expect(fromJsonLines(jsonLines)).toEqual([head, body]);
    });
  });

  describe('toJsonLines', () => {
    it('should transform JSON to JSON lines', () => {
      expect(toJsonLines([head, body])).toBe(
        '{"label":"head"}\n{"label":"body"}',
      );
    });
  });

  it('should transform to JSON lines and back', () => {
    expect(fromJsonLines(toJsonLines([head, body]))).toEqual([head, body]);
  });
});

describe('capitalize', () => {
  it('should transform the first string letter to upper case', () => {
    expect(capitalize('code PushUp')).toBe('Code PushUp');
  });

  it('should leave the first string letter in upper case', () => {
    expect(capitalize('Code PushUp')).toBe('Code PushUp');
  });

  it('should accept empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('apostrophize', () => {
  it("should add apostrophe and 's'", () => {
    expect(apostrophize('cli')).toBe("cli's");
  });

  it("should add apostrophe without 's' for words ending with 's'", () => {
    expect(apostrophize('yargs')).toBe("yargs'");
  });

  it("should add capital 'S' when upper case is defined", () => {
    expect(apostrophize('WORLD', true)).toBe("WORLD'S");
  });

  it('should leave formatting if provided', () => {
    expect(apostrophize('`git`')).toBe("`git`'s");
  });
});

describe('toNumberPrecision', () => {
  it.each([
    [12.1, 0, 12],
    [12.3, 1, 12.3],
    [12.35, 1, 12.4],
    [0.001, 2, 0],
  ])(
    'should round %d to %d decimal places as %d',
    (value, decimalPlaces, roundedValue) => {
      expect(toNumberPrecision(value, decimalPlaces)).toBe(roundedValue);
    },
  );
});

describe('toOrdinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [5, '5th'],
    [10, '10th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [171, '171st'],
    [172, '172nd'],
    [173, '173rd'],
  ])('should covert %d to ordinal as %s', (value, ordinalValue) => {
    expect(toOrdinal(value)).toBe(ordinalValue);
  });
});

describe('tableToStringArray', () => {
  it('should flatten Table shape of simple items', () => {
    expect(
      tableToStringArray({
        rows: [['1']],
      }),
    ).toStrictEqual([['0'], ['1']]);
  });

  it('should flatten Table shape of objects', () => {
    expect(
      tableToStringArray({
        rows: [{ test: 'prop value' }],
      }),
    ).toStrictEqual([['test'], ['prop value']]);
  });

  it('should flatten Table shape of objects and headings with key', () => {
    expect(
      tableToStringArray({
        headings: [{ key: 'slug' }],
        rows: [{ slug: 'my-slug', value: 'my value' }],
      }),
    ).toStrictEqual([['Slug'], ['my-slug']]);
  });

  it('should flatten Table shape of objects and headings with key and label', () => {
    expect(
      tableToStringArray({
        headings: [{ key: 'value', label: 'Value' }],
        rows: [{ slug: 'my-slug', value: 'my value' }],
      }),
    ).toStrictEqual([['Value'], ['my value']]);
  });

  it('should only output headings row the present rows', () => {
    expect(
      tableToStringArray({
        headings: [{ key: 'value', label: 'Value' }],
        rows: [{ slug: 'my-slug', value: 'my value' }],
      }),
    ).toStrictEqual([['Value'], ['my value']]);
  });
});

describe('rowToStringArray', () => {
  it('turns row of primitive values row to a string array', () => {
    expect(rowToStringArray([[1, 2, 3]])).toStrictEqual([['1', '2', '3']]);
  });

  it('turns row of object row to a string array', () => {
    expect(
      rowToStringArray([
        {
          prop1: 1,
          prop2: 2,
          prop3: 3,
        },
      ]),
    ).toStrictEqual([['1', '2', '3']]);
  });

  it('turns row of object row defined by headings to a string array', () => {
    expect(
      rowToStringArray(
        [
          {
            prop1: 1,
            prop2: 2,
            prop3: 3,
          },
        ],
        [{ key: 'prop2' }],
      ),
    ).toStrictEqual([['2']]);
  });
});

describe('getColumnAlignmentForKey', () => {
  it('return center align for a key and no heading definitions', () => {
    expect(getColumnAlignmentForKey('value')).toBe('c');
  });

  it('return center align for a key and heading definitions without align', () => {
    expect(
      getColumnAlignmentForKey('value', [
        { key: 'value' },
        { key: 'other-prop' },
      ]),
    ).toBe('c');
  });

  it('return defined align for a key', () => {
    expect(
      getColumnAlignmentForKey('value', [
        { key: 'value', align: 'l' },
        { key: 'other-prop' },
      ]),
    ).toBe('l');
  });
});

describe('getColumnAlignmentForIndex', () => {
  it('return center align for a index and no heading definitions', () => {
    expect(getColumnAlignmentForIndex(60)).toBe('c');
  });

  it('return center align for a index and heading definitions without align', () => {
    expect(
      getColumnAlignmentForIndex(1, [{ key: 'other-prop' }, { key: 'value' }]),
    ).toBe('c');
  });

  it('return defined align for a index', () => {
    expect(
      getColumnAlignmentForIndex(1, [
        { key: 'other-prop' },
        { key: 'value', align: 'l' },
      ]),
    ).toBe('l');
  });
});

describe('getColumnAlignments', () => {
  it('return center align for primitive rows without heading definitions', () => {
    expect(getColumnAlignments([[1, 2, 3]])).toStrictEqual(['c', 'c', 'c']);
  });

  it('return accept align for primitive rows and heading definitions', () => {
    expect(getColumnAlignments([[1, 2, 3]], [{ align: 'l' }])).toStrictEqual([
      'l',
      'c',
      'c',
    ]);
  });

  it('return center align for object rows without heading definitions', () => {
    expect(
      getColumnAlignments([
        { value: 1, name: 'first' },
        { value: 2, name: 'second' },
        { value: 3, name: 'third' },
      ]),
    ).toStrictEqual(['c', 'c']);
  });

  it('return accept align for object rows and heading definitions', () => {
    expect(
      getColumnAlignments(
        [
          { value: 1, name: 'first' },
          { value: 2, name: 'second' },
          { value: 3, name: 'third' },
        ],
        [{ key: 'value', align: 'l' }],
      ),
    ).toStrictEqual(['l', 'c']);
  });

  it('throws for a undefined row', () => {
    expect(() =>
      getColumnAlignments([undefined as unknown as TableRow]),
    ).toThrow('first row cant be undefined.');
  });
});
