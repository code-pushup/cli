import { describe, expect, it } from 'vitest';
import {
  type TableCellValue,
  tableCellValueSchema,
  weightSchema,
} from './schemas.js';

describe('primitiveValueSchema', () => {
  it('should accept a valid union', () => {
    const value: TableCellValue = 'test';
    expect(() => tableCellValueSchema.parse(value)).not.toThrow();
  });

  it('should throw for a invalid union', () => {
    const value = new Date();
    expect(() => tableCellValueSchema.parse(value)).toThrow('invalid_union');
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
