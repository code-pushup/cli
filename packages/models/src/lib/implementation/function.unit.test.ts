import { z } from 'zod/v4';
import {
  convertAsyncZodFunctionToSchema,
  convertSyncZodFunctionToSchema,
} from './function.js';

describe('convertAsyncZodFunctionToSchema', () => {
  it('should create a Zod schema', () => {
    expect(
      convertAsyncZodFunctionToSchema(
        z.function({ output: z.promise(z.url()) }),
      ),
    ).toBeInstanceOf(z.ZodType);
  });

  it('should accept a valid function', async () => {
    const schema = convertAsyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.promise(z.int()) }),
    );

    const fn = (input: string) => Promise.resolve(input.length);

    expect(() => schema.parse(fn)).not.toThrow();
    await expect(schema.parse(fn)('')).resolves.toBe(0);
  });

  it('should reject a non-function value', () => {
    const schema = convertAsyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.promise(z.int()) }),
    );

    expect(() => schema.parse(123)).toThrow(
      'Expected function, received number',
    );
  });

  it('should validate function arguments at runtime', async () => {
    const schema = convertAsyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.promise(z.int()) }),
    );

    await expect(
      schema.parse((input: string) => Promise.resolve(input.length))(
        // @ts-expect-error testing invalid argument type
        null,
      ),
    ).rejects.toThrow('expected string, received null');
  });

  it('should validate function return type at runtime', async () => {
    const schema = convertAsyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.promise(z.int()) }),
    );

    await expect(
      schema.parse(() => Promise.resolve(Math.random()))(''),
    ).rejects.toThrow('expected int, received number');
  });

  it('should add $ZodFunction metadata for zod2md', () => {
    const factory = z.function({
      input: [z.string()],
      output: z.promise(z.int()),
    });
    const schema = convertAsyncZodFunctionToSchema(factory);

    expect(z.globalRegistry.get(schema)).toHaveProperty(
      '$ZodFunction',
      factory,
    );
  });
});

describe('convertSyncZodFunctionToSchema', () => {
  it('should create a Zod schema', () => {
    expect(
      convertSyncZodFunctionToSchema(z.function({ output: z.url() })),
    ).toBeInstanceOf(z.ZodType);
  });

  it('should accept a valid function', () => {
    const schema = convertSyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.int() }),
    );

    const fn = (input: string) => input.length;

    expect(() => schema.parse(fn)).not.toThrow();
    expect(schema.parse(fn)('')).toBe(0);
  });

  it('should reject a non-function value', () => {
    const schema = convertSyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.int() }),
    );

    expect(() => schema.parse(123)).toThrow(
      'Expected function, received number',
    );
  });

  it('should validate function arguments at runtime', () => {
    const schema = convertSyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.int() }),
    );

    expect(() =>
      schema.parse((input: string) => input.length)(
        // @ts-expect-error testing invalid argument type
        null,
      ),
    ).toThrow('expected string, received null');
  });

  it('should validate function return type at runtime', () => {
    const schema = convertSyncZodFunctionToSchema(
      z.function({ input: [z.string()], output: z.int() }),
    );

    expect(() => schema.parse(() => Math.random())('')).toThrow(
      'expected int, received number',
    );
  });

  it('should add $ZodFunction metadata for zod2md', () => {
    const factory = z.function({
      input: [z.string()],
      output: z.int(),
    });
    const schema = convertSyncZodFunctionToSchema(factory);

    expect(z.globalRegistry.get(schema)).toHaveProperty(
      '$ZodFunction',
      factory,
    );
  });
});
