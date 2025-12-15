# build-target

An Nx plugin that automatically creates `build` targets for projects with a `tsconfig.lib.json` file.

## Overview

This plugin detects `tsconfig.lib.json` files in your workspace and automatically generates a `build` target for those
projects. The build target uses the `@nx/js:tsc` executor to compile TypeScript libraries.

## Quick Start

### Using the Nx Plugin

The plugin is already registered in your `nx.json`:

```jsonc
{
  "plugins": ["./tools/build-target/src/build-target.plugin.ts"],
}
```

Added target

```json
{
  "projects": {
    "your-project-name": {
      "targets": {
        "build": {
          "dependsOn": ["^build"],
          "inputs": ["production", "^production"],
          "cache": true,
          "outputs": ["{options.outputPath}"],
          "executor": "@nx/js:tsc",
          "options": {
            "outputPath": "{projectRoot}/dist",
            "main": "{projectRoot}/src/index.ts",
            "tsConfig": "{ projectRoot}/tsconfig.lib.json",
            "assets": ["{projectRoot}/*.md"]
          }
        }
      }
    }
  }
}
```
