import { z } from 'zod/v4';
import type { $ZodFunction } from 'zod/v4/core';

// https://github.com/matejchalk/zod2md?tab=readme-ov-file#function-schemas
export function convertZodFunctionToSchema<T extends $ZodFunction>(factory: T) {
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
