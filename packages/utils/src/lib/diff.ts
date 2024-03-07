export type Diff<T> = {
  before: T;
  after: T;
};

export function matchArrayItemsByKey<T>({
  before,
  after,
  key,
}: Diff<T[]> & { key: keyof T | ((item: T) => unknown) }) {
  const pairs: Diff<T>[] = [];
  const added: T[] = [];

  const afterKeys = new Set<unknown>();
  const keyFn = typeof key === 'function' ? key : (item: T) => item[key];

  // eslint-disable-next-line functional/no-loop-statements
  for (const afterItem of after) {
    const afterKey = keyFn(afterItem);
    afterKeys.add(afterKey);

    const match = before.find(beforeItem => keyFn(beforeItem) === afterKey);
    if (match) {
      // eslint-disable-next-line functional/immutable-data
      pairs.push({ before: match, after: afterItem });
    } else {
      // eslint-disable-next-line functional/immutable-data
      added.push(afterItem);
    }
  }

  const removed = before.filter(
    beforeItem => !afterKeys.has(keyFn(beforeItem)),
  );

  return {
    pairs,
    added,
    removed,
  };
}

export function comparePairs<T>(
  pairs: Diff<T>[],
  equalsFn: (pair: Diff<T>) => boolean,
) {
  return pairs.reduce<{ changed: Diff<T>[]; unchanged: T[] }>(
    (acc, pair) => ({
      ...acc,
      ...(equalsFn(pair)
        ? { unchanged: [...acc.unchanged, pair.after] }
        : { changed: [...acc.changed, pair] }),
    }),
    {
      changed: [],
      unchanged: [],
    },
  );
}
