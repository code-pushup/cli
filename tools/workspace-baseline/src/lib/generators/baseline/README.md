# Baseline Generator

#### @code-pushup/workspace-baseline:baseline

## Usage

The baseline generator scans projects in your workspace, finds tsconfig files, and generates baseline configuration files in the baseline directory.

### Generate baselines for all projects

```bash
nx generate @code-pushup/workspace-baseline:baseline
```

### Filter projects by tags

```bash
nx g @code-pushup/workspace-baseline:baseline --projectsFilter=--tags=scope:api
```

### Match specific tsconfig files

```bash
nx g @code-pushup/workspace-baseline:baseline --configMatcher="tsconfig.*.json"
```

### Combined filters

```bash
nx g @code-pushup/workspace-baseline:baseline --projectsFilter=--tags=scope:api --configMatcher="tsconfig.{lib,test}.json"
```

### Exclude projects

```bash
nx g @code-pushup/workspace-baseline:baseline --projectsFilter=--exclude=*-e2e
```

## What it does

For each project matching the filter criteria, the generator:

1. Finds all `tsconfig*.json` files (or files matching the `configMatcher` pattern)
2. Creates corresponding baseline files in the baseline directory
3. Baseline files follow the pattern: `tsconfig.{name}.baseline.ts`

Example:

```text
Root/
├── packages/
│   └── my-package/
│       ├── tsconfig.lib.json 👈 found
│       └── tsconfig.test.json 👈 found
└── tools/
    └── workspace-baseline/
        └── baseline/
            ├── tsconfig.lib.baseline.ts 👈 generated
            └── tsconfig.test.baseline.ts 👈 generated
```

## Options

| Name                 | type                      | description                                                                                                                            |
| -------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **--projectsFilter** | `string[]` (OPTIONAL)     | Nx filter syntax to filter projects (e.g., `['--tags=scope:api', '--affected', '--exclude=*-e2e']`). Multiple filters can be combined. |
| **--configMatcher**  | `string` (OPTIONAL)       | Glob pattern to match tsconfig files (e.g., `"tsconfig.*.json"` or `"tsconfig.{lib,test}.json"`). Defaults to `"tsconfig*.json"`.      |
| **--skipFormat**     | `boolean` (DEFAULT false) | Skip formatting of changed files.                                                                                                      |
| **--skipExisting**   | `boolean` (DEFAULT false) | Skip creating baseline files if they already exist.                                                                                    |

## Project Filtering

The generator supports Nx filter syntax:

- `--tags=<tag>`: Filter projects by tag (project must have the tag)
- `--exclude=<pattern>`: Exclude projects matching the glob pattern
- Project names: Direct project name matching

Examples:

- `--projectsFilter=--tags=scope:api` - Only projects with `scope:api` tag
- `--projectsFilter=--exclude=*-e2e` - Exclude all e2e projects
- `--projectsFilter=my-project` - Only the `my-project` project
- `--projectsFilter=--tags=scope:api --exclude=*-test` - Projects with `scope:api` tag but exclude test projects

## Baseline Directory

Baseline files are created in the baseline directory, which can be configured via the `BASELINE_DIR` environment variable. If not set, defaults to `tools/workspace-baseline/baseline`.

```bash
BASELINE_DIR=custom/path/baseline nx g @code-pushup/workspace-baseline:baseline
```

## Preview Mode

Show what will be generated without writing to disk:

```bash
nx g @code-pushup/workspace-baseline:baseline --dry-run
```
