export function filterItemRefsBy<T extends { refs: object[] }>(
  items: T[],
  refFilterFn: (item: T['refs'][number]) => boolean,
) {
  return (
    items
      .map(item => ({
        ...item,
        refs: item.refs.filter(refFilterFn),
      }))
      // remove item with empty refs
      .filter(item => item.refs.length)
  );
}
