import ansis from 'ansis';
import { vol } from 'memfs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { ZodError, z } from 'zod';
import { SchemaValidationError, validate, validateAsync } from './validate.js';

describe('validate', () => {
  beforeEach(() => {
    // Set up memfs with package.json for tests that use async transforms
    // This prevents unhandled rejections when async operations continue after validation errors
    vol.fromJSON({ 'package.json': '{ "name": "test" }' }, '/test');
  });

  afterEach(async () => {
    // Allow any lingering async operations from transforms to complete
    // This prevents unhandled rejections in subsequent tests
    await new Promise(resolve => setImmediate(resolve));
  });

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

  it('should throw if async schema provided (handled by validateAsync)', () => {
    const projectNameSchema = z
      .string()
      .optional()
      .transform(
        async name =>
          name || JSON.parse(await readFile('package.json', 'utf8')).name,
      )
      .meta({ title: 'ProjectName' });

    expect(() => validate(projectNameSchema, undefined)).toThrow(
      'Encountered Promise during synchronous parse. Use .parseAsync() instead.',
    );
  });
});

describe('validateAsync', () => {
  it('should parse schema with async transform', async () => {
    vol.fromJSON({ 'package.json': '{ "name": "core" }' }, '/test');
    const projectNameSchema = z
      .string()
      .optional()
      .transform(
        async name =>
          name || JSON.parse(await readFile('package.json', 'utf8')).name,
      )
      .meta({ title: 'ProjectName' });

    await expect(validateAsync(projectNameSchema, undefined)).resolves.toBe(
      'core',
    );
  });

  it('should parse schema with async refinement', async () => {
    vol.fromJSON({ 'package.json': '{}' }, '/test');
    const filePathSchema = z
      .string()
      .refine(
        file =>
          stat(file)
            .then(stats => stats.isFile())
            .catch(() => false),
        { error: 'File does not exist' },
      )
      .transform(file => path.resolve(process.cwd(), file))
      .meta({ title: 'FilePath' });

    await expect(validateAsync(filePathSchema, 'package.json')).resolves.toBe(
      path.join(process.cwd(), 'package.json'),
    );
  });

  it('should reject with formatted error if async schema is invalid', async () => {
    vol.fromJSON({}, '/test');
    const filePathSchema = z
      .string()
      .refine(
        file =>
          stat(file)
            .then(stats => stats.isFile())
            .catch(() => false),
        { error: 'File does not exist' },
      )
      .meta({ title: 'FilePath' });

    await expect(validateAsync(filePathSchema, 'package.json')).rejects.toThrow(
      `Invalid ${ansis.bold('FilePath')}\n✖ File does not exist`,
    );
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
