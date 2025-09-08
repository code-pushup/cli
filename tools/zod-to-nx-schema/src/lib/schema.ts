import { z } from 'zod';

export const CliArgsSchema = z
  .object({
    schemaModulePath: z.string().min(1, '--schemaModulePath is required').meta({
      describe:
        'Path to the TypeScript module that exports the Zod schema to convert',
    }),

    outputPath: z.string().optional().meta({
      describe: 'Optional output path for the generated JSON schema file',
    }),

    exportName: z.string().default('default').meta({
      describe:
        "Name of the export from the schema module (defaults to 'default')",
    }),

    filename: z.string().optional().meta({
      describe: 'Custom filename for the output (overrides auto-derived name)',
    }),

    title: z.string().optional().meta({
      describe: 'Title to include in the generated JSON schema',
    }),

    description: z.string().optional().meta({
      describe: 'Description to include in the generated JSON schema',
    }),

    includeCommandDefault: z.boolean().default(true).meta({
      describe:
        'Whether to include Nx $default for command parameter (defaults to true)',
    }),

    additionalProperties: z.boolean().default(true).meta({
      describe:
        'Whether to allow additional properties in the schema (defaults to true)',
    }),
  })
  .meta({
    describe:
      'Zod schema for CLI arguments validation. Validates and transforms command line arguments for the zod-to-nx-schema tool. Supports both positional and named arguments with sensible defaults.',
  });

export type CliArgs = z.infer<typeof CliArgsSchema>;
