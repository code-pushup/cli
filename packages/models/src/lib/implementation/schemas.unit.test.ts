import { describe, expect, it } from 'vitest';
import { PrimitiveValue, tableCellValueSchema } from './schemas';

describe('primitiveValueSchema', () => {
  it('should accept a valid union', () => {
    const value: PrimitiveValue = 'test';
    expect(() => tableCellValueSchema.parse(value)).not.toThrow();
  });

  it('should throw for a invalid union', () => {
    const value = new Date();
    expect(() => tableCellValueSchema.parse(value)).toThrow('invalid_union');
  });
});
