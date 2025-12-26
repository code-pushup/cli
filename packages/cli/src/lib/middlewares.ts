import type { MiddlewareFunction } from 'yargs';
import { profiler } from '@code-pushup/utils';
import { coreConfigMiddleware } from './implementation/core-config.middleware.js';
import { filterMiddleware } from './implementation/filter.middleware.js';
import { logIntroMiddleware } from './implementation/log-intro.middleware.js';
import { setVerboseMiddleware } from './implementation/set-verbose.middleware.js';

export const middlewares = [
  {
    middlewareFunction: logIntroMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: true,
  },
  {
    middlewareFunction: setVerboseMiddleware as MiddlewareFunction,
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
