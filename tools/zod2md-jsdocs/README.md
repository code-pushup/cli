# @code-pushup/zod2md-jsdocs

TypeScript transformer plugin that automatically enhances type definitions with JSDoc comments and schema metadata.

## Purpose

This package provides a TypeScript compiler transformer that automatically adds JSDoc documentation to type aliases and interfaces during compilation. It's designed to improve developer experience by injecting helpful metadata and documentation links directly into generated type definitions.

## How It Works

The [TS transformer](https://github.com/itsdouges/typescript-transformer-handbook) hooks into the TypeScript compilation process using `ts-patch` and automatically adds JSDoc comments above type definitions. Each comment includes:

- The type name
- A description explaining the type is derived from a Zod schema
- A link to the type reference documentation

## Example

Given a type definition like:

```typescript
export type Report = {
  // ... type properties
};
```

The transformer automatically generates:

```typescript
/**
 * Type Definition: `Report`
 *
 * This type is derived from a Zod schema and represents
 * the validated structure of `Report` used within the application.
 *
 * @see {@link https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md#report}
 */
export type Report = {
  // ... type properties
};
```

## Usage

1. `ts-patch install`

2. Add the transformer to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "./path/to/transformer/dist",
        "afterDeclarations": true,
        "baseUrl": "https://example.com/docs/api-reference.md"
      }
    ]
  }
}
```

3. Build your TypeScript project. The transformer will run automatically and add JSDoc comments to your type definitions.

### Options

| Option              | Type      | Required | Description                                                                                                                                                         |
| ------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transform`         | `string`  | Yes      | Path to the transformer module                                                                                                                                      |
| `afterDeclarations` | `boolean` | No       | Set to `true` to run the transformer after TypeScript generates declaration files (`.d.ts`). This ensures JSDoc comments are added to the emitted type definitions. |
| `baseUrl`           | `string`  | Yes      | Base URL for documentation links (e.g., `https://example.com/docs/api-reference.md`)                                                                                |
