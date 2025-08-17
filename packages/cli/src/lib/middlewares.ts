import type { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware.js';
import { filterMiddleware } from './implementation/filter.middleware.js';
import { setVerboseMiddleware } from './implementation/set-verbose.middleware.js';

export const middlewares = [
  {
    middlewareFunction: setVerboseMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
  {
    middlewareFunction: coreConfigMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
  {
    middlewareFunction: filterMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
];
