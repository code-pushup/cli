import { configMiddleware } from './implementation/config-middleware';
import { MiddlewareFunction } from 'yargs';

export const middlewares = [{ middlewareFunction: configMiddleware }] as const satisfies readonly {
  middlewareFunction: MiddlewareFunction;
  applyBeforeValidation?: boolean;
}[];
