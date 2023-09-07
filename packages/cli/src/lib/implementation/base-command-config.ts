import {
  globalCliArgsSchema,
  refineCoreConfig,
  unrefinedCoreConfigSchema,
} from '@quality-metrics/models';
import { z } from 'zod';

export const commandBaseSchema = refineCoreConfig(
  globalCliArgsSchema.merge(unrefinedCoreConfigSchema),
);
export type CommandBase = z.infer<typeof commandBaseSchema>;
