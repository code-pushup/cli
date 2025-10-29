# Rolldown Nx Plugin

An Nx plugin that automatically integrates Rolldown into your build process.

## Features

- **Auto-discovery**: Automatically detects projects with `rolldown.config.ts`, `rolldown.config.js`, or `rolldown.config.mjs` files
- **Caching**: Full support for Nx caching to speed up builds
- **Project validation**: Only adds build targets to valid projects (with `package.json` or `project.json`)
- **Dependency tracking**: Properly tracks Rolldown and tsx as external dependencies

## Installation

Add the plugin to your `nx.json`:

```json
{
  "plugins": ["./tools/src/rolldown.plugin.ts"]
}
```

Or with custom options:

```json
{
  "plugins": [
    {
      "plugin": "./tools/src/rolldown.plugin.ts",
      "options": {
        "targetName": "build"
      }
    }
  ]
}
```

## Options

| Option       | Type     | Default | Description                        |
| ------------ | -------- | ------- | ---------------------------------- |
| `targetName` | `string` | `build` | Name of the build target to create |

## Usage

Once configured, the plugin will automatically create build targets for any project containing a Rolldown config file.

### Running builds

```bash
# Build a specific project
nx build my-package

# Build all projects with Rolldown configs
nx run-many --target=build --all
```

### Example project structure

```
packages/
  my-package/
    src/
      index.ts
    rolldown.config.mjs
    package.json
```

With the plugin configured, you can run:

```bash
nx build my-package
```

## How it works

The plugin:

1. Scans your workspace for `rolldown.config.{ts,js,mjs}` files
2. Validates that the directory contains a valid project
3. Creates a build target using Rolldown's native CLI
4. Configures caching with appropriate inputs and outputs

The plugin uses the Rolldown CLI directly with the `-c` flag to specify the config file, as documented in the [Rolldown Getting Started guide](https://rolldown.rs/guide/getting-started)

## Integration with base config

Works seamlessly with the `rolldown.base.ts` configuration:

```javascript
// packages/my-package/rolldown.config.mjs
import { baseConfig } from '../../rolldown.base.ts';

export default baseConfig({
  projectRoot: import.meta.dirname,
  preserveModulesRoot: 'src/lib',
});
```

## Caching

The plugin is configured with:

- **Inputs**: `production` files and dependencies
- **Outputs**: `{projectRoot}/dist` directory
- **External dependencies**: `rolldown` and `tsx`

This ensures that builds are only re-run when source files or dependencies change.
