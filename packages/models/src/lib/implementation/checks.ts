import type { z } from 'zod';
import { hasDuplicateStrings } from './utils.js';

export function createCheck<T>(
  findErrorFn: (value: T) => false | { message: string },
): z.core.CheckFn<T> {
  return ctx => {
    const error = findErrorFn(ctx.value);
    if (error) {
      // eslint-disable-next-line functional/immutable-data, no-param-reassign
      ctx.issues = [
        ...ctx.issues,
        {
          code: 'custom',
          message: error.message,
          input: ctx.value,
        },
      ];
    }
  };
}

export function createDuplicatesCheck<T>(
  keyFn: (item: T) => string,
  errorMsgFn: (duplicates: string[]) => string,
): z.core.CheckFn<T[]> {
  return createCheck(items => {
    const keys = items.map(keyFn);
    const duplicates = hasDuplicateStrings(keys);
    return duplicates && { message: errorMsgFn(duplicates) };
  });
}

export function createDuplicateSlugsCheck<T extends { slug: string }>(
  name: 'Audit' | 'Plugin' | 'Category' | 'Group',
): z.core.CheckFn<T[]> {
  return createDuplicatesCheck(
    ({ slug }) => slug,
    duplicates =>
      `${name} slugs must be unique, but received duplicates: ${duplicates.map(slug => JSON.stringify(slug)).join(', ')}`,
  );
}
