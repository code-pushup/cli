import { TS_CODE_RANGE_NAMES } from './ts-error-codes.js';

type TsCodeRanges = typeof TS_CODE_RANGE_NAMES;
export type CodeRangeName = TsCodeRanges[keyof TsCodeRanges];

export type SemVerString = `${number}.${number}.${number}`;
