import { basename, dirname, extname, join, resolve } from 'node:path';
import { type ParseArgsConfig, parseArgs } from 'node:util';
import { z } from 'zod';
import { type CliArgs, CliArgsSchema } from './schema.js';
import type { NxExecutorSchema } from './types.js';

type CreateNxExecutorSchemaOptions = {
  name: string;
  title: string;
  description?: string;
  additionalProperties: boolean;
  includeCommandDefault: boolean;
  baseProps: Record<string, any>;
  rest: any;
};

export function createNxExecutorSchema(
  options: CreateNxExecutorSchemaOptions,
): NxExecutorSchema {
  const {
    name,
    title,
    description,
    additionalProperties,
    includeCommandDefault,
    baseProps,
    rest,
  } = options;

  const properties = {
    ...baseProps,
    ...(includeCommandDefault &&
      baseProps['command'] && {
        command: {
          ...baseProps['command'],
          $default: { $source: 'argv', index: 0 },
        },
      }),
  };

  return {
    ...rest,
    $schema: 'http://json-schema.org/schema',
    $id: name,
    title,
    type: 'object',
    additionalProperties,

    ...(description && { description }),

    properties,
  };
}

/**
 * Converts a string to PascalCase with 'Schema' suffix
 * Examples:
 * - 'default' -> 'DefaultSchema'
 * - 'basicExecutorOptions' -> 'BasicExecutorOptionsSchema'
 * - 'my-config' -> 'MyConfigSchema'
 * - 'user_settings' -> 'UserSettingsSchema'
 */
export function toPascalCaseSchemaName(
  exportName: string,
  suffix = 'Schema',
): string {
  if (exportName === 'default') {
    return 'DefaultSchema';
  }

  const pascalCase = exportName
    .split(/[-_\s]+|(?=[A-Z])/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return pascalCase.endsWith(suffix) ? pascalCase : `${pascalCase}${suffix}`;
}

/**
 * Auto-derives output path from input path by replacing extension with .json
 */
export function deriveOutputPath(inputPath: string): string {
  const dir = dirname(inputPath);
  const name = basename(inputPath, extname(inputPath));
  return join(dir, `${name}.json`);
}

/**
 * Parse command line arguments using Node.js built-in parseArgs utility
 *
 * @param raw - Raw command line arguments (defaults to process.argv.slice(2))
 * @returns Parsed and validated CLI arguments
 */
export function parseCliArgs(raw: string[] = process.argv.slice(2)): CliArgs {
  const options = {
    schemaModulePath: { type: 'string' },
    outputPath: { type: 'string' },
    exportName: { type: 'string' },
    filename: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    includeCommandDefault: { type: 'boolean' },
    additionalProperties: { type: 'boolean' },
  } satisfies ParseArgsConfig['options'];

  const { values } = parseArgs({
    args: raw,
    options,
    allowNegative: true, // supports --no-includeCommandDefault, etc.
    strict: false, // Allow unknown options to be more flexible
  });

  return CliArgsSchema.parse(values);
}

/**
 * Loads a module and extracts a specific export
 *
 * @param schemaModulePath - Path to the module file
 * @param exportName - Name of the export to extract (defaults to 'default')
 * @returns The exported value from the module
 * @throws Error if the export is not found in the module
 */
export async function loadModuleExport(
  schemaModulePath: string,
  exportName = 'default',
): Promise<any> {
  const modulePath = resolve(schemaModulePath);
  const module = await import(modulePath);

  const exportedValue = module[exportName];
  if (!exportedValue) {
    throw new Error(
      `Export '${exportName}' not found in module '${schemaModulePath}'`,
    );
  }

  return exportedValue;
}
