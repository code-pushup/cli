import path from 'node:path';
import { camelCaseToKebabCase } from '@code-pushup/utils';
import { TS_ERROR_CODES } from './ts-error-codes.js';
import type { CompilerOptionName, SemVerString } from './types.js';

const TS_PLUGIN_CACHE = path.join('.code-pushup', 'typescript-plugin');
export const TS_CONFIG_DIR = path.join(TS_PLUGIN_CACHE, 'default-ts-configs');
export const getTsDefaultsFilename = (version: SemVerString) =>
  `tsconfig.${version}.json`;
/** Build Reverse Lookup Map. It will a map with key as the error code and value as the audit slug. */
export const AUDIT_LOOKUP = Object.values(TS_ERROR_CODES)
  .flatMap(v => Object.entries(v))
  .reduce<Map<number, CompilerOptionName>>((lookup, [name, codes]) => {
    codes.forEach((code: number) =>
      lookup.set(code, camelCaseToKebabCase(name) as CompilerOptionName),
    );
    return lookup;
  }, new Map<number, CompilerOptionName>());
