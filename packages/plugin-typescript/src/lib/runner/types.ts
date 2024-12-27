import { TS_ERROR_CODES } from './ts-error-codes.js';

export type ErrorCodes = typeof TS_ERROR_CODES;

export type CompilerOptionName = {
  [K in keyof ErrorCodes]: keyof ErrorCodes[K];
}[keyof ErrorCodes];

export type SemVerString = `${number}.${number}.${number}`;
