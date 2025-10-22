import { bold } from 'ansis';
import path from 'node:path';
import { ZodError, z } from 'zod';

type SchemaValidationContext = {
  schemaType: string;
  sourcePath?: string;
};

export class SchemaValidationError extends Error {
  constructor(
    { schemaType, sourcePath }: SchemaValidationContext,
    error: ZodError,
  ) {
    const formattedError = z.prettifyError(error);
    const pathDetails = sourcePath
      ? ` in ${bold(path.relative(process.cwd(), sourcePath))}`
      : '';
    super(`Failed parsing ${schemaType}${pathDetails}.\n\n${formattedError}`);
  }
}

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: z.input<T>,
  { schemaType, sourcePath }: SchemaValidationContext,
): z.output<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new SchemaValidationError({ schemaType, sourcePath }, error);
    }
    throw error;
  }
}
