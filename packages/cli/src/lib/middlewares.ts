import type { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware';
import { filterMiddleware } from './implementation/filter.middleware';

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
