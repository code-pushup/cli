import { MiddlewareFunction } from 'yargs';
import { coreConfigMiddleware } from './implementation/core-config.middleware';

export const middlewares = [
  { middlewareFunction: coreConfigMiddleware as unknown as MiddlewareFunction },
];
