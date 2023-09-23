import {
  globalOptionsSchema,
  refineCoreConfig,
  unrefinedCoreConfigSchema,
} from '@quality-metrics/models';
import { z } from 'zod';

export const commandBaseSchema = refineCoreConfig(
  globalOptionsSchema.merge(unrefinedCoreConfigSchema),
);
export type CommandBase = z.infer<typeof commandBaseSchema>;
