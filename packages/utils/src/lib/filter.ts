export function filterItemRefsBy<T extends { refs: object[] }>(
  items: T[],
  refFilterFn?: (item: T['refs'][number]) => boolean,
) {
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
