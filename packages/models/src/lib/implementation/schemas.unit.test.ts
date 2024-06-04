import { describe, expect, it } from 'vitest';
import { PrimitiveValue, primitiveValueSchema, weightSchema } from './schemas';

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

describe('weightSchema', () => {
  it('should accept an integer', () => {
    expect(() => weightSchema.parse(1)).not.toThrow();
  });

  it('should accept a float', () => {
    expect(() => weightSchema.parse(0.5)).not.toThrow();
  });

  it('should accept zero', () => {
    expect(() => weightSchema.parse(0)).not.toThrow();
  });

  it('should throw for negative number', () => {
    expect(() => weightSchema.parse(-1)).toThrow('too_small');
  });
});
