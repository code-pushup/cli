import type { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware';
import { filterPluginsMiddleware } from './implementation/filter-plugins.middleware';

export const middlewares = [
  {
    middlewareFunction: coreConfigMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
  {
    middlewareFunction:
      filterPluginsMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
];
