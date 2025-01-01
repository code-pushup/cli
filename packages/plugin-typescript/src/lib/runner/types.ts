import { TS_CODE_RANGE_NAMES, TS_ERROR_CODES } from './ts-error-codes.js';

export type ErrorCodes = typeof TS_ERROR_CODES;

export type CompilerOptionName = {
  [K in keyof ErrorCodes]: keyof ErrorCodes[K];
}[keyof ErrorCodes];

type TsCodeRanges = typeof TS_CODE_RANGE_NAMES;
export type CodeRangeName = TsCodeRanges[keyof TsCodeRanges];

export type SemVerString = `${number}.${number}.${number}`;
