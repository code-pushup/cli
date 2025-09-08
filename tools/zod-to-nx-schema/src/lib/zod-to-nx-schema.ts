import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { NxExecutorSchema, NxSchemaOptions } from './types.js';
import { createNxExecutorSchema, loadModuleExport } from './utils.js';

export interface GenerateSchemaOptions {
  schemaModulePath: string;
  exportName?: string;
  outputPath: string;
  schemaOptions: {
    name: string;
    title?: string;
    description?: string;
    includeCommandDefault?: boolean;
    additionalProperties?: boolean;
  };
}

export function zodToNxSchema(
  zodSchema: z.ZodType,
  options: NxSchemaOptions,
): NxExecutorSchema {
  const {
    name,
    title = name,
    description,
    includeCommandDefault = true,
    additionalProperties = true,
  } = options;

  const baseSchema = z.toJSONSchema(zodSchema) as any;

  const { properties: baseProps = {}, ...rest } = baseSchema;

  return createNxExecutorSchema({
    name,
    title,
    description,
    additionalProperties,
    includeCommandDefault,
    baseProps,
    rest,
  });
}

export function zodToNxSchemaString(
  zodSchema: z.ZodType,
  options: NxSchemaOptions,
  indent = 2,
): string {
  const schema = zodToNxSchema(zodSchema, options);
  return JSON.stringify(schema, null, indent);
}

export async function generateSchemaFile(
  options: GenerateSchemaOptions,
): Promise<void> {
  const {
    schemaModulePath,
    exportName = 'default',
    outputPath,
    schemaOptions,
  } = options;

  try {
    const zodSchema = await loadModuleExport(schemaModulePath, exportName);

    const schemaJson = zodToNxSchemaString(zodSchema, {
      ...schemaOptions,
    });

    const outputFilePath = resolve(outputPath);
    writeFileSync(outputFilePath, schemaJson, 'utf8');

    console.log(`✅ Generated schema file: ${outputFilePath}`);
  } catch (error) {
    console.error('❌ Error generating schema file:', error);
    process.exit(1);
  }
}
