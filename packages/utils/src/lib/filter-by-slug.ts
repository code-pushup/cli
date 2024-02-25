type WithRefs<T extends object = object> = { refs: T[] };

export function filterItemsWithRefBy<T extends object>(
  items: WithRefs<T>[],
  refFilterFn?: (item: T) => boolean,
): WithRefs<T>[] {
  return filterBy(
    items
      .map(item => ({
        ...item,
        refs: filterBy(item.refs, refFilterFn),
      }))
      // remove item with empty refs
      .filter(item => item.refs.length),
  );
}

export function filterBy<T = unknown>(
  refs: T[] = [],
  filterFn?: (t: T) => boolean,
): T[] {
  if (filterFn === undefined || refs.length === 0) {
    return refs;
  }
  return refs.filter(filterFn);
}
