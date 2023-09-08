import { MiddlewareFunction } from 'yargs';
import { configMiddleware } from './implementation/config-middleware';

export const middlewares: {
  middlewareFunction: MiddlewareFunction;
  applyBeforeValidation?: boolean;
}[] = [{ middlewareFunction: configMiddleware }];
