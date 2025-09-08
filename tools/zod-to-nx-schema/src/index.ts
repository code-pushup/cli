export {
  zodToNxSchema,
  zodToNxSchemaString,
  generateSchemaFile,
  type GenerateSchemaOptions,
} from './lib/zod-to-nx-schema.js';

export { toPascalCaseSchemaName } from './lib/utils.js';

export { runCli } from './lib/cli.js';

export type {
  NxSchemaOptions,
  NxExecutorSchema,
  NxJSONSchema,
} from './lib/types.js';
