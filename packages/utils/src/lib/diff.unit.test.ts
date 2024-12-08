import { comparePairs, matchArrayItemsByKey } from './diff.js';

describe('matchArrayItemsByKey', () => {
  it('should pair up items by key string', () => {
    expect(
      matchArrayItemsByKey({
        before: [
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
        ],
        after: [
          { id: 2, name: 'Baz' },
          { id: 3, name: 'Foo' },
        ],
        key: 'id',
      }),
    ).toEqual({
      pairs: [
        { before: { id: 2, name: 'Bar' }, after: { id: 2, name: 'Baz' } },
      ],
      added: [{ id: 3, name: 'Foo' }],
      removed: [{ id: 1, name: 'Foo' }],
    });
  });

  it('should pair up items by key function', () => {
    expect(
      matchArrayItemsByKey({
        before: [
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
        ],
        after: [
          { id: 2, name: 'Baz' },
          { id: 3, name: 'Foo' },
        ],
        key: ({ id, name }) => `${id}-${name}`,
      }),
    ).toEqual({
      pairs: [],
      added: [
        { id: 2, name: 'Baz' },
        { id: 3, name: 'Foo' },
      ],
      removed: [
        { id: 1, name: 'Foo' },
        { id: 2, name: 'Bar' },
      ],
    });
  });
});

describe('comparePairs', () => {
  it('should split changed and unchanged according to equals function', () => {
    expect(
      comparePairs(
        [
          { before: { id: 1, value: 100 }, after: { id: 1, value: 100 } },
          { before: { id: 2, value: 200 }, after: { id: 2, value: 250 } },
          { before: { id: 3, value: 300 }, after: { id: 3, value: 300 } },
          { before: { id: 4, value: 400 }, after: { id: 4, value: 400 } },
          { before: { id: 5, value: 500 }, after: { id: 5, value: 600 } },
        ],
        ({ before, after }) => before.value === after.value,
      ),
    ).toEqual({
      changed: [
        { before: { id: 2, value: 200 }, after: { id: 2, value: 250 } },
        { before: { id: 5, value: 500 }, after: { id: 5, value: 600 } },
      ],
      unchanged: [
        { id: 1, value: 100 },
        { id: 3, value: 300 },
        { id: 4, value: 400 },
      ],
    });
  });
});
