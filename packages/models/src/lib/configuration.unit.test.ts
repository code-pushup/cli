import { describe, expect, it } from 'vitest';
import { toolCommandSchema } from './configuration.js';

describe('toolCommandSchema', () => {
  it('should validate a command with required fields', () => {
    const data = { command: 'npx' };
    const result = toolCommandSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.command).toBe('npx');
      expect(result.data.args).toBeUndefined();
    }
  });

  it('should validate a command with args', () => {
    const data = { command: 'npx', args: ['eslint', 'src/'] };
    const result = toolCommandSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.command).toBe('npx');
      expect(result.data.args).toEqual(['eslint', 'src/']);
    }
  });

  it('should fail if command is missing', () => {
    const data = { args: ['eslint', 'src/'] };
    const result = toolCommandSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if command is empty', () => {
    const data = { command: '' };
    const result = toolCommandSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if args is not an array of strings', () => {
    const data = { command: 'npx', args: [123, true] };
    const result = toolCommandSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
