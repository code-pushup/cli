import type { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware.js';
import { filterMiddleware } from './implementation/filter.middleware.js';

export const middlewares = [
  {
    middlewareFunction: coreConfigMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
  {
    middlewareFunction: filterMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
];
