import { describe, expect, it } from 'vitest';
import { PrimitiveValue, primitiveValueSchema } from './schemas';

describe('primitiveValueSchema', () => {
  it('should accept a valid union', () => {
    const value: PrimitiveValue = 'test';
    expect(() => primitiveValueSchema.parse(value)).not.toThrow();
  });

  it('should throw for a invalid union', () => {
    const value = new Date();
    expect(() => primitiveValueSchema.parse(value)).toThrow('invalid_union');
  });
});
