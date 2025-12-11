# zod2md-jsdocs

A comprehensive toolset for generating and enhancing TypeScript documentation from Zod schemas. This package combines an Nx plugin for automated documentation generation with a TypeScript transformer that enriches type definitions with JSDoc comments.

## What's Included

This package provides two main components:

1. **[Nx Plugin](./docs/zod2md-jsdocs-nx-plugin.md)** - Automatically generates documentation targets for projects with Zod schemas
2. **[TypeScript Transformer](./docs/zod2md-jsdocs-ts-transformer.md)** - Enhances generated type definitions with JSDoc comments and schema metadata

## Quick Start

### Using the Nx Plugin

Add the plugin to your `nx.json`:

```jsonc
{
  "plugins": ["./tools/zod2md-jsdocs/src/lib/plugin.js"],
}
```

Create a `zod2md.config.ts` in your project, and you'll automatically get a `generate-docs` target.

[Learn more about the Nx Plugin →](./docs/zod2md-jsdocs-nx-plugin.md)

### Using the TypeScript Transformer

1. Install ts-patch: `ts-patch install`
2. Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "./tools/zod2md-jsdocs/dist/src",
        "afterDeclarations": true,
        "baseUrl": "https://example.com/docs/api-reference.md"
      }
    ]
  }
}
```

[Learn more about the TypeScript Transformer →](./docs/zod2md-jsdocs-ts-transformer.md)
