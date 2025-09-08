# Zod to Nx Schema

A TypeScript library and CLI tool that converts Zod schemas to Nx executor schema.json files. This tool uses `zod-to-json-schema` under the hood and adds Nx-specific features like `$default` for argv parameters.

## Features

- ✅ Converts Zod schemas to JSON Schema (draft-07) compatible with Nx executors
- ✅ Automatically handles complex types like arrays of enums
- ✅ Adds Nx-specific `$default` for command parameters from argv
- ✅ Supports regex patterns, min/max constraints, URL validation, etc.
- ✅ CLI tool for build-time schema generation
- ✅ TypeScript API for programmatic usage
- ✅ Automatic schema name generation from export names in PascalCase

## Installation

```bash
npm install @code-pushup/zod-to-nx-schema
```

## Quick Usage

Install the CLI:
`npm install -g @code-pushup/zod-to-nx-schema`

```bash
# Auto-derive output filename (./src/schema.ts → ./src/schema-transformed.json)
npx zod-to-nx-schema ./src/schema.ts

# Explicit output path
npx zod-to-nx-schema ./src/schema.ts ./schema-transformed.json

# Custom filename in same directory (./src/schema.ts → ./src/executor.json)
npx zod-to-nx-schema ./src/schema.ts --filename executor.json

# With named export (schema name is automatically derived)
npx zod-to-nx-schema ./src/schema.ts --export-name autorunOptions

# With additional options
npx zod-to-nx-schema ./src/schema.ts \
  --export-name autorunOptions \
  --title "CodePushUp CLI autorun executor" \
  --description "Executes the @code-pushup/cli autorun command"
```

## Options

| Name                          | Type      | Description                                                             |
| ----------------------------- | --------- | ----------------------------------------------------------------------- |
| **schemaModulePath**          | `string`  | Path to the TypeScript module that exports the Zod schema to convert    |
| **outputPath**                | `string`  | Optional output path for the generated JSON schema file                 |
| **--export-name**             | `string`  | Name of the export from the schema module (defaults to 'default')       |
| **--filename**                | `string`  | Custom filename for the output (overrides auto-derived name)            |
| **--title**                   | `string`  | Title to include in the generated JSON schema                           |
| **--description**             | `string`  | Description to include in the generated JSON schema                     |
| **--include-command-default** | `boolean` | Whether to include Nx $default for command parameter (defaults to true) |
| **--additional-properties**   | `boolean` | Whether to allow additional properties in the schema (defaults to true) |

### Programmatic API

```typescript
import { z } from 'zod';
import { zodToNxSchemaString } from '@code-pushup/zod-to-nx-schema';

// 1) Define your options with Zod
export const CliArgsSchema = z.object({
  schemaModulePath: z.string().min(1, 'schemaModulePath cant be empty').meta({
    describe: 'Path to the TypeScript module that exports the Zod schema to convert',
  }),

  outputPath: z.string().optional().meta({
    describe: 'Optional output path for the generated JSON schema file',
  }),

  exportName: z.string().default('default').meta({
    describe: "Name of the export from the schema module (defaults to 'default')",
  }),
});

// 2) Convert to Nx schema
const nxSchemaJson = zodToNxSchemaString(CliArgsSchema, {
  name: 'CliArgsSchema',
  title: 'Zod to Nx Schema Converter',
  description: 'Converts Zod schemas to Nx executor schema.json files with automatic type validation and Nx-specific features',
  includeCommandDefault: true,
  additionalProperties: true,
});

console.log(nxSchemaJson);
```

## API Reference

### `zodToNxSchema(zodSchema, options)`

Converts a Zod schema to an Nx executor schema object.

**Parameters:**

- `zodSchema`: The Zod schema to convert
- `options`: Configuration options
  - `name`: Schema name (used for `$id`)
  - `title?`: Schema title (defaults to `name`)
  - `description?`: Schema description
  - `includeCommandDefault?`: Add Nx `$default` for command parameter (default: `true`)
  - `additionalProperties?`: Allow additional properties (default: `true`)

**Returns:** `NxExecutorSchema` object

### `zodToNxSchemaString(zodSchema, options, indent?)`

Same as `zodToNxSchema` but returns a JSON string.

**Parameters:**

- Same as `zodToNxSchema`
- `indent?`: JSON indentation (default: `2`)

**Returns:** JSON string

### Nx Integration

- Automatically adds `$default: { $source: 'argv', index: 0 }` for command parameters (only when command exists)
- Follows Nx executor schema conventions
- Compatible with `nx.json` and executor registration
- Preserves all JSON Schema fields from Zod (required, definitions, etc.)
- Nx fields always take precedence over Zod-generated fields

## Limitations

JSON Schema cannot express Zod transforms/refinements with custom logic. Stick to validators that map directly:

- ✅ `regex()`, `min()`, `max()`, `url()`, `int()`, `gt()`, `lt()`
- ❌ Custom `.catch()`, `.refine()` or `.transform()` functions
