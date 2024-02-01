/**
 * This function calculates coverage as ratio of tested entities vs total
 * @param hit how many entities were executed in at least one test
 * @param found  how many entities were found overall
 * @returns coverage between 0 and 1
 */
export function calculateCoverage(hit: number, found: number): number {
  return found > 0 ? hit / found : 0;
}
