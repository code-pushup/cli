# workspace-baseline

A comprehensive toolset for maintaining consistent TypeScript configuration across all projects in an Nx workspace. This package provides sync generators that automatically ensure all `tsconfig.*.json` files conform to baseline configurations.

## What's Included

This package provides the following components:

1. **[Nx Sync Baseline Generator](./src/lib/generators/sync-baseline/README.md)** - Automatically syncs TypeScript configuration across all projects to match the baseline
2. **[Nx Configuration Generator](./src/lib/generators/configuration/README.md)** - Generates TypeScript configuration files for projects
3. **[Baseline Configuration](./baseline/tsconfig-lib.baseline.ts)** - Defines the standard TypeScript configuration that all projects should follow
4. **[JSON Updater Utilities](./src/lib/json-updater.ts)** - Provides utilities for updating JSON files with diagnostics
