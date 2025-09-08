import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodToNxSchema, zodToNxSchemaString } from './zod-to-nx-schema.js';

describe('zodToNxSchema', () => {
  it('should convert a simple Zod schema to Nx schema', () => {
    const schema = z.object({
      command: z.string().optional().meta({
        describe: 'A valid email address',
      }),
      verbose: z.boolean().optional().describe('Enable verbose logging'),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
      title: 'Test Schema',
      description: 'A test schema',
    });

    expect(result).toEqual({
      $schema: 'http://json-schema.org/schema',
      $id: 'TestSchema',
      title: 'Test Schema',
      description: 'A test schema',
      type: 'object',
      additionalProperties: true,
      properties: {
        command: {
          type: 'string',
          describe: 'A valid email address',
          $default: { $source: 'argv', index: 0 },
        },
        verbose: {
          type: 'boolean',
          description: 'Enable verbose logging',
        },
      },
    });
  });

  it('should handle array of enums correctly', () => {
    const schema = z.object({
      format: z.array(z.enum(['json', 'md'])).optional(),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
    });

    expect(result.properties.format).toEqual({
      type: 'array',
      items: {
        type: 'string',
        enum: ['json', 'md'],
      },
    });
  });

  it('should not add command default when disabled', () => {
    const schema = z.object({
      command: z.string().optional(),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
      includeCommandDefault: false,
    });

    expect(result.properties['command']).toEqual({
      type: 'string',
    });
  });

  it('should return JSON string with zodToNxSchemaString', () => {
    const schema = z.object({
      test: z.string(),
    });

    const result = zodToNxSchemaString(schema, {
      name: 'TestSchema',
    });

    expect(typeof result).toBe('string');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should not add command default when command does not exist', () => {
    const schema = z.object({
      verbose: z.boolean().optional(),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
      includeCommandDefault: true,
    });

    expect(result.properties['command']).toBeUndefined();
    expect(result.properties['verbose']).toEqual({
      type: 'boolean',
    });
  });

  it('should preserve other JSON Schema fields from Zod', () => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      count: z.number().int().positive(),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
      includeCommandDefault: false,
    });

    expect(result.properties['name']).toEqual({
      type: 'string',
      minLength: 1,
      maxLength: 100,
    });
    expect(result.properties['count']).toEqual({
      type: 'integer',
      exclusiveMinimum: 0,
      maximum: 9007199254740991,
    });
  });

  it('should preserve descriptions from Zod schema properties', () => {
    const schema = z.object({
      command: z.string().optional().describe('The command to run'),
      verbose: z.boolean().optional().describe('Enable verbose logging'),
      timeout: z.number().describe('Timeout in milliseconds'),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
      title: 'Test Schema',
      description: 'A test schema',
    });

    expect(result.properties['command']).toEqual({
      type: 'string',
      description: 'The command to run',
      $default: { $source: 'argv', index: 0 },
    });
    expect(result.properties['verbose']).toEqual({
      type: 'boolean',
      description: 'Enable verbose logging',
    });
    expect(result.properties['timeout']).toEqual({
      type: 'number',
      description: 'Timeout in milliseconds',
    });
  });

  it('should preserve descriptions for complex nested schemas', () => {
    const nestedSchema = z.object({
      outputDir: z.string().describe('Output directory path'),
      format: z
        .array(z.enum(['json', 'md']))
        .optional()
        .describe('Output formats'),
    });

    const schema = z.object({
      name: z.string().describe('Project name'),
      config: nestedSchema
        .partial()
        .optional()
        .describe('Configuration options'),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
      includeCommandDefault: false,
    });

    expect(result.properties.name).toEqual({
      type: 'string',
      description: 'Project name',
    });
    expect(result.properties.config).toEqual({
      type: 'object',
      description: 'Configuration options',
      properties: {
        outputDir: {
          type: 'string',
          description: 'Output directory path',
        },
        format: {
          type: 'array',
          description: 'Output formats',
          items: {
            type: 'string',
            enum: ['json', 'md'],
          },
        },
      },
      additionalProperties: false,
    });
  });

  it('should handle schemas without descriptions gracefully', () => {
    const schema = z.object({
      command: z.string().optional(),
      verbose: z.boolean().optional().describe('Enable verbose logging'),
      count: z.number(),
    });

    const result = zodToNxSchema(schema, {
      name: 'TestSchema',
    });

    expect(result.properties.command).toEqual({
      type: 'string',
      $default: { $source: 'argv', index: 0 },
    });
    expect(result.properties.verbose).toEqual({
      type: 'boolean',
      description: 'Enable verbose logging',
    });
    expect(result.properties.count).toEqual({
      type: 'number',
    });
  });
});
