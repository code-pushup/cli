# Sync Baseline Generator (Nx sync generator)

**Package:** `@tooling/workspace-baseline`  
**Generator:** `sync-baseline`

---

## Usage

```bash
nx generate @tooling/workspace-baseline:sync-baseline
```

The sync generator automatically targets **all projects** in the workspace.

---

## What the generator does

For each project in the workspace, the generator performs the following checks and fixes:

### 1. TypeScript configuration

- Searches for **existing** `tsconfig.json`, `tsconfig.lib.json`, and `tsconfig.test.json` files
- If found:
  - Verifies that baseline TypeScript compiler options are configured
  - Automatically patches the `tsconfig` files if options are missing or incorrect

---

## Baseline configurations

The generator applies standardized configurations for three TypeScript configuration files:

### tsconfig.json (base configuration)

- Target: ES2022
- Module: ES2022
- Module resolution: bundler
- Strict type checking enabled
- Additional compiler options for consistency

### tsconfig.lib.json (library configuration)

- Extends: ./tsconfig.json
- Output directory: ../../dist/out-tsc
- Declaration files enabled
- Includes: src/\*_/_.ts
- Excludes test and config files

### tsconfig.test.json (test configuration)

- Extends: ./tsconfig.json
- Output directory: ../../dist/out-tsc
- Includes Vitest globals and Node types
- Includes test files and directories

---

## Example project structure

```txt
Root/
├── libs/
│   └── project-name/
│       ├── project.json            👈 project configuration
│       ├── tsconfig.json           👈 base TypeScript config (patched)
│       ├── tsconfig.lib.json       👈 library TypeScript config (patched)
│       ├── tsconfig.test.json      👈 test TypeScript config (patched)
│       └── src/
│           └── index.ts
└── ...
```

---

## Targeted behavior summary

- ✔ Applies to all projects in the workspace
- ✔ Missing baseline config → patched automatically
- ✔ Existing config matches baseline → no changes, no errors
- ✔ Partially configured files → updated to match baseline

---

## Per-project usage (optional)

You can still scope execution to a single project:

```bash
nx g @tooling/workspace-baseline:sync-baseline project-name
```

---

## Previewing the generator

To preview what the generator would change without applying modifications:

```bash
nx g @tooling/workspace-baseline:sync-baseline --dry-run
```

This is especially useful when integrating the sync generator into CI or workspace maintenance workflows.

---

## Register a Global Sync Generator

Global sync generators are registered in the _nx.json_ file like this:

_nx.json_

```json
{
  "sync": {
    "globalGenerators": ["./tools/workspace-baseline:sync-baseline"]
  }
}
```

## Register a Local Sync Generator

Local sync generators are registered in the project's `package.json` or `project.json` file under the `syncGenerators` property for specific targets:

_package.json_

```json
{
  "name": "my-project",
  "nx": {
    "targets": {
      "build": {
        "syncGenerators": ["./tools/workspace-baseline:sync-baseline"]
      }
    }
  }
}
```

_project.json_

```json
{
  "name": "my-project",
  "targets": {
    "build": {
      "syncGenerators": ["./tools/workspace-baseline:sync-baseline"]
    }
  }
}
```

With this configuration, the sync generator will run automatically before the specified target (e.g., `build`).

## Notes

- This is a **sync generator**, not a build step
- It is safe to run repeatedly
- All changes are deterministic and idempotent
- Designed to work seamlessly with `nx sync` and automated workflows
