import ansis from 'ansis';
import path from 'node:path';
import { ZodError, type ZodType, z } from 'zod';

type SchemaValidationContext = {
  filePath?: string;
};

/**
 * Autocompletes valid Zod Schema input for convience, but will accept any other data as well
 */
type ZodInputLooseAutocomplete<T extends ZodType> =
  | z.input<T>
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  | {}
  | null
  | undefined;

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
    this.name = SchemaValidationError.name;
  }
}

export function validate<T extends ZodType>(
  schema: T,
  data: ZodInputLooseAutocomplete<T>,
  context: SchemaValidationContext = {},
): z.output<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  throw new SchemaValidationError(result.error, schema, context);
}

export async function validateAsync<T extends ZodType>(
  schema: T,
  data: ZodInputLooseAutocomplete<T>,
  context: SchemaValidationContext = {},
): Promise<z.output<T>> {
  const result = await schema.safeParseAsync(data);
  if (result.success) {
    return result.data;
  }
  throw new SchemaValidationError(result.error, schema, context);
}
