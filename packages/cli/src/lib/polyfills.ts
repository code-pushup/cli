if (!Array.prototype.toSorted) {
  // eslint-disable-next-line functional/immutable-data
  Array.prototype.toSorted = function <T>(
    this: T[],
    compareFn?: (a: T, b: T) => number,
  ): T[] {
    return [...this].sort(compareFn);
  };
}
