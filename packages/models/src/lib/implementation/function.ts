import { z } from 'zod/v4';
import type { $ZodFunction } from 'zod/v4/core';

// https://zod.dev/v4/changelog?id=zfunction
// https://github.com/colinhacks/zod/issues/4143#issuecomment-2931729793
// https://github.com/matejchalk/zod2md?tab=readme-ov-file#function-schemas

/**
 * Converts Zod v4 function factory (returned by `z.function`) to Zod schema.
 *
 * Supports asynchronous functions. For synchronous functions, you can use {@link convertSyncZodFunctionToSchema}.
 *
 * @param factory `z.function({  input: [...], output: ... })`
 * @returns Zod schema with compile-time and runtime validations.
 */
export function convertAsyncZodFunctionToSchema<T extends $ZodFunction>(
  factory: T,
) {
  return z
    .custom()
    .transform((arg, ctx) => {
      if (typeof arg !== 'function') {
        ctx.addIssue(`Expected function, received ${typeof arg}`);
        return z.NEVER;
      }
      return factory.implementAsync(arg as Parameters<T['implementAsync']>[0]);
    })
    .meta({
      // enables zod2md to include function signature in docs
      $ZodFunction: factory,
    });
}

/**
 * Converts Zod v4 function factory (returned by `z.function`) to Zod schema.
 *
 * **IMPORTANT!** Use for synchronous functions only. For asynchronous functions use {@link convertAsyncZodFunctionToSchema}.
 *
 * @throws `Encountered Promise during synchronous parse. Use .parseAsync() instead.` if used with async functions.
 *
 * @param factory `z.function({  input: [...], output: ... })`
 * @returns Zod schema with compile-time and runtime validations.
 */
export function convertSyncZodFunctionToSchema<T extends $ZodFunction>(
  factory: T,
) {
  return z
    .custom()
    .transform((arg, ctx) => {
      if (typeof arg !== 'function') {
        ctx.addIssue(`Expected function, received ${typeof arg}`);
        return z.NEVER;
      }
      return factory.implement(arg as Parameters<T['implement']>[0]);
    })
    .meta({
      // enables zod2md to include function signature in docs
      $ZodFunction: factory,
    });
}
