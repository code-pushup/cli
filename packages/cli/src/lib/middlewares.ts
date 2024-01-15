import { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware';
import { onlyPluginsMiddleware } from './implementation/only-plugins.middleware';

export const middlewares = [
  { middlewareFunction: coreConfigMiddleware as unknown as MiddlewareFunction },
  {
    middlewareFunction: onlyPluginsMiddleware as unknown as MiddlewareFunction,
  },
];
