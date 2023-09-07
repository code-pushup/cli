import { coreConfigSchema, globalCliArgsSchema } from '@quality-metrics/models';
import { z } from 'zod';

export { yargsCli } from './lib/cli';
export const baseCommandSchema = globalCliArgsSchema//.merge(coreConfigSchema);
export type BaseCommandSchema = z.infer<typeof baseCommandSchema>;
