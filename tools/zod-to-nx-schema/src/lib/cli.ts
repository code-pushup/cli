import { dirname, join } from 'node:path';
import {
  deriveOutputPath,
  parseCliArgs,
  toPascalCaseSchemaName,
} from './utils.js';
import { generateSchemaFile } from './zod-to-nx-schema.js';

export function runCli(): void {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: zod-to-nx-schema [options]

Options:
  --schemaModulePath <path>    Path to the module that exports the Zod schema (required)
  --outputPath <path>          Path where the schema.json file should be written (optional, auto-derived if not provided)
  --exportName <name>          Name of the export (default: 'default')
  --filename <name>            Override the auto-derived output filename
  --title <title>              Title for the schema
  --description <desc>         Description for the schema
  --no-includeCommandDefault   Don't add Nx $default for command parameter
  --no-additionalProperties    Don't allow additional properties

Examples:
  # Basic usage
  zod-to-nx-schema --schemaModulePath ./src/schema.ts
  
  # With custom output path
  zod-to-nx-schema --schemaModulePath ./src/schema.ts --outputPath ./custom.json
  
  # With custom filename in same directory
  zod-to-nx-schema --schemaModulePath ./src/schema.ts --filename executor.json
  
  # With metadata
  zod-to-nx-schema --schemaModulePath ./src/schema.ts --exportName basicExecutorOptions --title "My Schema"
    `);
    process.exit(1);
  }

  try {
    const parsedArgs = parseCliArgs(args);
    let finalOutputPath: string;

    if (parsedArgs.outputPath) {
      finalOutputPath = parsedArgs.outputPath;
    } else if (parsedArgs.filename) {
      const inputDir = dirname(parsedArgs.schemaModulePath);
      finalOutputPath = join(inputDir, parsedArgs.filename);
    } else {
      finalOutputPath = deriveOutputPath(parsedArgs.schemaModulePath);
    }

    const schemaName = toPascalCaseSchemaName(parsedArgs.exportName);

    generateSchemaFile({
      schemaModulePath: parsedArgs.schemaModulePath,
      exportName: parsedArgs.exportName,
      outputPath: finalOutputPath,
      schemaOptions: {
        name: schemaName,
        title: parsedArgs.title,
        description: parsedArgs.description,
        includeCommandDefault: parsedArgs.includeCommandDefault,
        additionalProperties: parsedArgs.additionalProperties,
      },
    });
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
