# @code-pushup/zod2md-jsdocs-nx-plugin

The Nx Plugin for [zod2md](https://github.com/matejchalk/zod2md), a tool for generating documentation from Zod schemas.

Why should you use this plugin?

- Zero setup cost. Just add a `zod2md.config.ts` file and you're good to go.
- Automatic target generation
- Minimal configuration
- Automated caching and dependency tracking

## Usage

```jsonc
// nx.json
{
  //...
  "plugins": ["./tools/zod2md-jsdocs-nx-plugin/src/lib/plugin.js"],
}
```

or with options:

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "./tools/zod2md-jsdocs-nx-plugin/src/lib/plugin.js",
      "options": {
        "targetName": "zod-docs",
      },
    },
  ],
}
```

Now every project with a `zod2md.config.ts` file will have a `generate-docs` target automatically created.

- `nx run <project-name>:generate-docs`

Run it and the project will automatically generate documentation from your Zod schemas.

```text
Root/
├── project-name/
│   ├── zod2md.config.ts
│   ├── docs/
│   │   └── project-name-reference.md 👈 generated
│   └── ...
└── ...
```

The generated target:

1. Runs `zod2md` with the project's configuration
2. Formats the generated markdown with Prettier
3. Caches the result for better performance

### Passing zod2md options

You can override the config and output paths when running the target:

```bash
# Use custom output file
nx generate-docs my-project --output=docs/custom-api.md

# Use custom config file
nx generate-docs my-project --config=custom-zod2md.config.ts

# Use both
nx generate-docs my-project --config=custom.config.ts --output=docs/api.md
```

Default values:

- `config`: `{projectRoot}/zod2md.config.ts`
- `output`: `{projectRoot}/docs/{projectName}-reference.md`

## Options

| Name           | type                               | description                                            |
| -------------- | ---------------------------------- | ------------------------------------------------------ |
| **targetName** | `string` (DEFAULT 'generate-docs') | The id used to identify a target in your project.json. |

All options are optional and provided in the `nx.json` file.

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "./tools/zod2md-jsdocs-nx-plugin/src/lib/plugin.js",
      "options": {
        "targetName": "docs",
      },
    },
  ],
}
```

## Configuration

Create a `zod2md.config.ts` file in your project:

```ts
import type { Config } from 'zod2md';

export default {
  entry: 'packages/models/src/index.ts',
  tsconfig: 'packages/models/tsconfig.lib.json',
  format: 'esm',
  title: 'Models reference',
  output: 'packages/models/docs/models-reference.md',
} satisfies Config;
```

For a full list of configuration options visit the [zod2md documentation](https://github.com/matejchalk/zod2md?tab=readme-ov-file#configuration).
