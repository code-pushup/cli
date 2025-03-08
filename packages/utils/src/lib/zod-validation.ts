import { bold, red } from 'ansis';
import path from 'node:path';
import type { z } from 'zod';
import {
  type MessageBuilder,
  fromError,
  isZodErrorLike,
} from 'zod-validation-error';

type SchemaValidationContext = {
  schemaType: string;
  sourcePath?: string;
};

export class SchemaValidationError extends Error {
  constructor(
    { schemaType, sourcePath }: SchemaValidationContext,
    error: Error,
  ) {
    const validationError = fromError(error, {
      messageBuilder: zodErrorMessageBuilder,
    });
    const pathDetails = sourcePath
      ? ` in ${bold(path.relative(process.cwd(), sourcePath))}`
      : '';
    super(
      `Failed parsing ${schemaType}${pathDetails}.\n\n${validationError.message}`,
    );
  }
}

export function formatErrorPath(errorPath: (string | number)[]): string {
  return errorPath
    .map((key, index) => {
      if (typeof key === 'number') {
        return `[${key}]`;
      }
      return index > 0 ? `.${key}` : key;
    })
    .join('');
}

const zodErrorMessageBuilder: MessageBuilder = issues =>
  issues
    .map(issue => {
      const formattedMessage = red(`${bold(issue.code)}: ${issue.message}`);
      const formattedPath = formatErrorPath(issue.path);
      if (formattedPath) {
        return `Validation error at ${bold(formattedPath)}\n${formattedMessage}\n`;
      }
      return `${formattedMessage}\n`;
    })
    .join('\n');

export function parseSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: z.input<T>,
  { schemaType, sourcePath }: SchemaValidationContext,
): z.output<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (isZodErrorLike(error)) {
      throw new SchemaValidationError({ schemaType, sourcePath }, error);
    }
    throw error;
  }
}
