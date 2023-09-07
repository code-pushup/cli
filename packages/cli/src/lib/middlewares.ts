import { configMiddleware } from './implemetation/config-middleware';
import { MiddlewareFunction } from 'yargs';

export const middlewares: {
  middlewareFunction: MiddlewareFunction;
  applyBeforeValidation?: boolean;
}[] = [{ middlewareFunction: configMiddleware as any }];
