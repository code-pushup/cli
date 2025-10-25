import ansis from 'ansis';
import path from 'node:path';
import z, { ZodError } from 'zod';
import { SchemaValidationError, validate } from './validate.js';

describe('validate', () => {
  it('should return parsed data if valid', () => {
    const configSchema = z
      .object({
        entry: z.string(),
        tsconfig: z.string().default('tsconfig.json'),
      })
      .meta({ title: 'Config' });
    type Config = z.infer<typeof configSchema>;

    expect(validate(configSchema, { entry: 'src/main.ts' })).toEqual<Config>({
      entry: 'src/main.ts',
      tsconfig: 'tsconfig.json',
    });
  });

  it('should throw formatted error if invalid', () => {
    const userSchema = z
      .object({
        name: z.string().min(1),
        address: z.string(),
        dateOfBirth: z.iso.date().optional(),
      })
      .meta({ title: 'User' });

    expect(() => validate(userSchema, { name: '', dateOfBirth: 'Jul 1, 1980' }))
      .toThrow(`Invalid ${ansis.bold('User')}
✖ Too small: expected string to have >=1 characters
  → at name
✖ Invalid input: expected string, received undefined
  → at address
✖ Invalid ISO date
  → at dateOfBirth`);
  });
});

describe('SchemaValidationError', () => {
  it('should format ZodError with z.prettifyError', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        input: 42,
        message: 'Invalid input: expected string, received number',
        path: ['id'],
      },
      {
        code: 'invalid_format',
        format: 'datetime',
        input: '1980-07-31',
        message: 'Invalid ISO datetime',
        path: ['logs', 11, 'timestamp'],
      },
    ]);

    expect(new SchemaValidationError(error, z.any(), {}).message).toContain(`
✖ Invalid input: expected string, received number
  → at id
✖ Invalid ISO datetime
  → at logs[11].timestamp`);
  });

  it('should use schema title from meta registry', () => {
    const schema = z.number().min(0).max(1).meta({ title: 'Score' });

    expect(
      new SchemaValidationError(new ZodError([]), schema, {}).message,
    ).toContain(`Invalid ${ansis.bold('Score')}\n`);
  });

  it('should use generic message if schema title not in registry', () => {
    const schema = z.number().min(0).max(1);

    expect(
      new SchemaValidationError(new ZodError([]), schema, {}).message,
    ).toContain('Invalid data\n');
  });

  it('should include relative file path if provided', () => {
    const schema = z.object({}).meta({ title: 'CoreConfig' });
    const filePath = path.join(process.cwd(), 'code-pushup.config.ts');

    expect(
      new SchemaValidationError(new ZodError([]), schema, { filePath }).message,
    ).toContain(
      `Invalid ${ansis.bold('CoreConfig')} in ${ansis.bold('code-pushup.config.ts')} file\n`,
    );
  });
});
