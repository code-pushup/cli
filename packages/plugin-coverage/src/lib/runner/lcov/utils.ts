import type { NumberRange } from './types';

/**
 * This function calculates coverage as ratio of tested entities vs total
 * @param hit how many entities were executed in at least one test
 * @param found  how many entities were found overall
 * @returns coverage between 0 and 1
 */
export function calculateCoverage(hit: number, found: number): number {
  return found > 0 ? hit / found : 1;
}

export function mergeConsecutiveNumbers(numberArr: number[]): NumberRange[] {
  return [...numberArr]
    .sort((a, b) => a - b)
    .reduce<NumberRange[]>((acc, currValue) => {
      const prevValue = acc.at(-1);
      if (
        prevValue != null &&
        (prevValue.start === currValue - 1 || prevValue.end === currValue - 1)
      ) {
        return [
          ...acc.slice(0, -1),
          { start: prevValue.start, end: currValue },
        ];
      }
      return [...acc, { start: currValue }];
    }, []);
}
