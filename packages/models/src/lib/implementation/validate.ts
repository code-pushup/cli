import ansis from 'ansis';
import path from 'node:path';
import { ZodError, type ZodType, z } from 'zod';

type SchemaValidationContext = {
  filePath?: string;
};

export class SchemaValidationError extends Error {
  constructor(
    error: ZodError,
    schema: ZodType,
    { filePath }: SchemaValidationContext,
  ) {
    const formattedError = z.prettifyError(error);
    const schemaTitle = z.globalRegistry.get(schema)?.title;
    const summary = [
      'Invalid',
      schemaTitle ? ansis.bold(schemaTitle) : 'data',
      filePath &&
        `in ${ansis.bold(path.relative(process.cwd(), filePath))} file`,
    ]
      .filter(Boolean)
      .join(' ');
    super(`${summary}\n${formattedError}\n`);
  }
}

export function validate<T extends ZodType>(
  schema: T,
  data: z.input<T> | {} | null | undefined, // loose autocomplete
  context: SchemaValidationContext = {},
): z.output<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  throw new SchemaValidationError(result.error, schema, context);
}
