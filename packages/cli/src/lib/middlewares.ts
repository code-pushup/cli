import { MiddlewareFunction } from 'yargs';
import { configMiddleware } from './implementation/config-middleware';

export const middlewares = [
  { middlewareFunction: configMiddleware as unknown as MiddlewareFunction },
];
