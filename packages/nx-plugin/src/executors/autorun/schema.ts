import { z } from 'zod';
import { baseExecutorSchema, uploadOnlySchema } from '../internal/schema';

export const autorunCommandOptionsSchema =
  baseExecutorSchema.merge(uploadOnlySchema);

export type AutorunCommandExecutorOptions = z.infer<
  typeof autorunCommandOptionsSchema
> & {
  persist?: Record<string, string | undefined>;
  upload?: Record<string, string | undefined>;
};
export default autorunCommandOptionsSchema;
