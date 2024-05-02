import { Table } from '@code-pushup/models';

export function tableToFlatArray({
  headings,
  rows,
}: Table): (string | number)[][] {
  const firstRow = rows[0];
  // Determine effective headings based on the input rows and optional headings parameter
  const generateHeadings = (): string[] => {
    if (headings && headings.length > 0) {
      return headings.map(({ label, key }) => label ?? key);
    } else {
      if (typeof firstRow === 'object' && !Array.isArray(firstRow)) {
        return Object.keys(firstRow);
      }
      // Default to indexing if the rows are primitive types or single-element arrays
      return firstRow?.map((_, idx) => idx.toString()) ?? [];
    }
  };

  // Construct the row data based on headings and type of row items
  const generateRows = (): (string | number)[][] =>
    rows.map(item => {
      if (typeof item === 'object' && !Array.isArray(item)) {
        // For object rows, map heading to the value in the object
        return headings
          ? headings.map(({ key }) => item[key] ?? '')
          : Object.values(item);
      }
      // For array rows, return the item itself (assuming one element per array for simplicity)
      if (Array.isArray(item)) {
        return item;
      }
      // This branch shouldn't be reached based on current spec, but included for robustness
      return [item];
    });

  const effectiveHeadings = generateHeadings();
  const tableRows = generateRows();

  // Combine headings and rows to create the full table array
  return [effectiveHeadings, ...tableRows];
}
