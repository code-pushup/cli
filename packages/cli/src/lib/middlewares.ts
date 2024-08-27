import type { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware';
import { onlyPluginsMiddleware } from './implementation/only-plugins.middleware';
import { skipPluginsMiddleware } from './implementation/skip-plugins.middleware';

export const middlewares = [
  {
    middlewareFunction: coreConfigMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
  {
    middlewareFunction: onlyPluginsMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
  {
    middlewareFunction: skipPluginsMiddleware as unknown as MiddlewareFunction,
    applyBeforeValidation: false,
  },
];
