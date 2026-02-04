# TypeScript Baseline Configuration

## Overview

The baseline configuration system ensures consistent TypeScript configuration across all projects in an Nx workspace. Baselines define standardized configurations that are automatically applied to matching `tsconfig.*.json` files.

## How Baselines Work

1. **Baseline Definition**: Each baseline specifies:
   - Target file pattern (e.g., `tsconfig.lib.json`)
   - Required compiler options
   - Include/exclude patterns
   - Optional tags for filtering

2. **Matching**: Baselines are matched to projects based on:
   - File existence (baseline only applies if the target file exists)
   - Project tags (optional filtering)

3. **Synchronization**: When a baseline matches:
   - Missing options are added
   - Incorrect options are updated
   - The file is automatically patched

## Baseline Types

### tsconfig.json (Base Configuration)

**File**: `baseline/tsconfig.baseline.ts`

Standardizes base TypeScript configuration:

- **Module**: ESNext
- **Strict mode**: Enabled with all strict flags
- **Types**: Includes vitest types
- **No extends enforcement**: Varies by project depth
- **No include/files enforcement**: Root configs with references should have empty arrays

**Example**:

```typescript
export const tsconfigBase = createTsconfigBase('tsconfig.json', {
  // Don't enforce extends as it varies by project depth
  enforceExtends: false,
  // Don't enforce include/files as root tsconfig.json files with references should have empty arrays
  enforceInclude: false,
  enforceExclude: false,
  compilerOptions: obj.add({
    module: 'ESNext',
    strict: true,
    noImplicitOverride: true,
    types: ['vitest'],
  }),
});
```

### tsconfig.lib.json (Library Configuration)

**File**: `baseline/tsconfig.lib.baseline.ts`

Standardizes library TypeScript configuration:

- **Extends**: `./tsconfig.json`
- **Output directory**: `../../dist/out-tsc`
- **Declaration files**: Enabled
- **Includes**: `src/**/*.ts`
- **Excludes**: Test files, mocks, config files
- **Types**: Node types
- **Tags**: `['tsc-bae', 'tsc-nx-plugin']` (applies only to projects with these tags)

**Example**:

```typescript
export const tsconfigLibBase = createTsconfigBase('tsconfig.lib.json', {
  tags: ['tsc-bae', 'tsc-nx-plugin'],
  extends: './tsconfig.json',
  compilerOptions: obj.add({
    outDir: '../../dist/out-tsc',
    declaration: true,
    types: ['node'],
  }),
  include: arr.add('src/**/*.ts'),
  exclude: arr.add('vitest.unit.config.ts', 'src/**/*.test.ts', 'mocks/**/*.ts'),
});
```

### tsconfig.test.json (Test Configuration)

**File**: `baseline/tsconfig.test.baseline.ts`

Standardizes test TypeScript configuration:

- **Extends**: `./tsconfig.json`
- **Output directory**: `../../dist/out-tsc`
- **Types**: Vitest globals, importMeta, vite/client, node
- **Includes**: Test files, vitest configs, mocks, type definitions
- **Renames**: `tsconfig.spec.json` files to `tsconfig.test.json` (for projects using spec naming)

**Example**:

```typescript
export const tsconfigTestBase = createTsconfigBase('tsconfig.test.json', {
  renameFrom: 'tsconfig.spec.json', // Match and rename from spec to test
  extends: './tsconfig.json',
  compilerOptions: obj.add({
    outDir: '../../dist/out-tsc',
    types: ['vitest/globals', 'vitest/importMeta', 'vite/client', 'node'],
  }),
  include: arr.add('vitest.unit.config.ts', 'vitest.int.config.ts', 'mocks/**/*.ts', 'src/**/*.test.ts'),
});
```

### tsconfig.e2e.json (E2E Configuration)

**File**: `baseline/tsconfig.e2e.baseline.ts`

Standardizes end-to-end test configuration.

- **Renames**: `tsconfig.spec.json` files to `tsconfig.test.json` (for e2e projects using spec naming)

### tsconfig.tools.json (Tools Configuration)

**File**: `baseline/tsconfig.tools.baseline.ts`

Standardizes tools configuration:

- **Uses**: nodenext types for tool scripts
- **Includes**: Tool config files (e.g., zod2md.config.ts)
- **Renames**: `tsconfig.perf.json` files to `tsconfig.tools.json` (for performance test configs)

### tsconfig.commonjs.json (CommonJS Configuration)

**File**: `baseline/tsconfig.commonjs.baseline.ts`

Standardizes CommonJS module configuration.

## Tags and Filtering

Baselines can use tags to filter which projects they apply to:

```typescript
export const tsconfigLibBase = createTsconfigBase('tsconfig.lib.json', {
  tags: ['tsc-bae', 'tsc-nx-plugin'], // Only applies to projects with these tags
  // ... config
});
```

**Tag Matching Rules**:

- If baseline has no tags → applies to all projects
- If baseline has tags → applies if project has ANY matching tag
- Tags are defined in `project.json` or `package.json`

## Creating Custom Baselines

To create a custom baseline:

1. Create a new baseline file in `baseline/` directory
2. Use `createTsconfigBase` to define the baseline
3. Export the baseline
4. Add it to `load-baseline-rc.ts`

**Example**:

```typescript
// baseline/tsconfig.custom.baseline.ts
import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { obj } from '../src/lib/baseline.tsconfig';

export const tsconfigCustomBase = createTsconfigBase('tsconfig.custom.json', {
  tags: ['custom-tag'],
  compilerOptions: obj.add({
    // Your custom options
  }),
});
```

The `loadBaselineRc` function automatically discovers and loads all baseline files ending in `baseline.ts` from the baseline directory (configurable via `BASELINE_DIR` environment variable, defaults to `tools/workspace-baseline/baseline`). No manual imports are required.

## Baseline Matching

Baselines are matched in the following order:

1. **File existence**: Baseline only applies if target file exists
2. **Tag filtering**: If baseline has tags, project must have at least one matching tag
3. **First match**: If multiple baselines match the same file, all are applied

## Configuration Examples

### Minimal Baseline

```typescript
createTsconfigBase('tsconfig.json', {
  compilerOptions: obj.add({
    strict: true,
  }),
});
```

### Baseline with Enforcement Options

```typescript
createTsconfigBase('tsconfig.json', {
  // Disable enforcement for properties that vary by project structure
  enforceExtends: false, // Don't enforce extends (varies by project depth)
  enforceInclude: false, // Don't enforce include (root configs with references)
  enforceExclude: false, // Don't enforce exclude (root configs with references)
  compilerOptions: obj.add({
    strict: true,
  }),
});
```

### Baseline with Custom Formatter

```typescript
createTsconfigBase('tsconfig.json', {
  formatter: createTsconfigFormatter({
    styling: 'minimal',
  }),
  compilerOptions: obj.add({
    strict: true,
  }),
});
```

## Notes

- Baselines are **idempotent** - safe to run repeatedly
- Baselines only **add or update** - they don't remove existing options (unless explicitly configured)
- Baselines are **deterministic** - same input always produces same output
- Baselines work with **nx sync** - automatically run before build targets
