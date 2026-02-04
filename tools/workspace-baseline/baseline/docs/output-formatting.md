# Output Formatting

## Overview

The output formatting system provides beautiful, semantic-level output for baseline synchronization diagnostics. Changes are shown per-project with set diffs for arrays, grouped booleans, and focused scalar changes. The format is configurable per baseline type and supports custom styling themes.

## Format Structure

The output uses a hierarchical structure with semantic grouping:

```
baseline-type out of sync: filename

project-name
  property
    + added-item
    - removed-item
  category
    + added-flag
    - removed-flag
    ~ flipped-flag: false → true
  property.path
    - old-value
    + new-value

---

baseline-type out of sync: filename

project-name
  property
    + added-item
```

### Grouping Hierarchy

1. **By Baseline Type**: All diagnostics from the same baseline type are grouped together
2. **Section Dividers**: Different baseline types are separated by `---`
3. **By Project**: Within each type, diagnostics are grouped by project name (no cross-project aggregation)
4. **By Property**: Within each project, changes are grouped by property path
5. **Semantic Formatting**: Arrays show set diffs, booleans are grouped by category, scalars show focused diffs

## Output Examples

### Array Changes (Set Diffs)

Arrays are shown as set diffs with `+` for additions and `-` for removals:

```
tsconfig out of sync: tsconfig.spec.json

local-action
  include
    + vite.config.ts
    + vite.config.mts
    + vitest.config.ts
    + vitest.config.mts
    + vitest.unit.config.ts
    + src/**/*.{spec,test}.{ts,tsx,js,jsx}
    + src/**/*.d.ts
    + ../../testing/test-setup/src/vitest.d.ts
```

### Boolean Flags (Grouped by Category)

Boolean flags within the same category are grouped together:

```
tsconfig out of sync: tsconfig.lib.json

project-name
  compilerOptions
    + strict
    + noImplicitReturns
    + noFallthroughCasesInSwitch
    + noImplicitOverride
    + noPropertyAccessFromIndexSignature
    - oldFlag
    ~ flippedFlag: false → true
```

### Scalar Values (Focused Diff)

Scalar values show focused diffs aligned with array format:

```
tsconfig out of sync: tsconfig.lib.json

project-name
  compilerOptions.module
    - CommonJS
    + ESNext

  compilerOptions.target
    - ES2015
    + ES2022

  extends
    - ../../tsconfig.base.json
    + ./tsconfig.json
```

### Mixed Changes

All change types can appear together:

```
tsconfig out of sync: tsconfig.lib.json

project-name
  include
    + src/**/*.ts
    + src/**/*.tsx

  compilerOptions
    + strict
    + noImplicitReturns
    - oldFlag

  compilerOptions.module
    - CommonJS
    + ESNext
```

### Multiple Baseline Types

When multiple baseline types have changes, they are separated by dividers:

```
tsconfig out of sync: tsconfig.lib.json

project-name
  compilerOptions.module
    - CommonJS
    + ESNext

---

tsconfig out of sync: tsconfig.test.json

project-name
  compilerOptions.types
    + vitest/globals
    + vitest/importMeta
    + vite/client
    + node
```

## Color Coding

Colors provide instant visual feedback on operation types:

- 🟢 **Green** = Addition (`+` prefix)
- 🔴 **Red** = Removal (`-` prefix)
- 🟡 **Yellow** = Update/Flipped (`~` prefix for booleans)

### Color Example

```
tsconfig out of sync: tsconfig.lib.json

project-name
  include
    + vite.config.ts          # green (addition)
    - old-file.ts              # red (removal)

  compilerOptions
    + strict                  # green (addition)
    - oldFlag                 # red (removal)
    ~ flippedFlag: false → true  # yellow (flipped)

  compilerOptions.module
    - CommonJS                # red (old value)
    + ESNext                  # green (new value)
```

## Formatting Rules

### Golden Rule: One Block Per Property

**Never show more than one diff block per property.** This eliminates repetition and noise.

### Array Changes

Arrays are always shown as set diffs:

- `+` prefix for added items
- `-` prefix for removed items
- Items are sorted alphabetically
- One block per array property

### Boolean Flags

Boolean flags are grouped by category:

- `+` prefix for added flags (undefined → true)
- `-` prefix for removed flags (true → undefined)
- `~` prefix for flipped flags (false → true or true → false)
- All booleans in the same category appear in one block

### Scalar Values

Scalar values show focused diffs:

- `-` prefix for old value
- `+` prefix for new value
- Aligned visually with array diffs
- One block per scalar property

## Styling Configuration

### Available Themes

#### Default Theme

Standard formatting with colors enabled:

```typescript
createTsconfigFormatter(); // or
createTsconfigFormatter({ styling: 'default' });
```

#### Minimal Theme

No colors, clean output:

```typescript
createTsconfigFormatter({ styling: 'minimal' });
```

#### Colorful Theme

Enhanced colors including project and category colors:

```typescript
createTsconfigFormatter({ styling: 'colorful' });
```

### Custom Styling

You can customize colors, formatting, and behavior:

```typescript
createTsconfigFormatter({
  styling: {
    colors: {
      addition: 'green',
      update: 'yellow',
      removal: 'red',
      undefined: 'gray',
      project: 'cyan', // Optional: color project names
      category: 'blue', // Optional: color category names
    },
    formatting: {
      indentSize: 2, // Indentation spaces per level
      arrow: '→', // Arrow symbol
      maxInlineArrayLength: 4, // Arrays ≤4 items shown inline
      maxTruncateArrayLength: 20, // Arrays >20 items truncated
    },
    enabled: {
      colors: true, // Enable/disable colors
      multiLineArrays: true, // Enable multi-line arrays
    },
  },
});
```

### Per-Baseline Styling

Each baseline can have its own formatter:

```typescript
const customFormatter = createTsconfigFormatter({
  styling: {
    colors: { addition: 'cyan', update: 'magenta' },
  },
});

export const tsconfigBase = createTsconfigBase('tsconfig.json', {
  formatter: customFormatter,
  compilerOptions: obj.add({
    strict: true,
  }),
});
```

## Terminal Compatibility

### Color Detection

Colors are always enabled by default. They can only be disabled by explicitly setting `colors: false` in your styling configuration.

### Disabling Colors

You can explicitly disable colors in your formatter configuration:

```typescript
createTsconfigFormatter({
  styling: {
    enabled: {
      colors: false,
    },
  },
});
```

Or use the minimal theme:

```typescript
createTsconfigFormatter({ styling: 'minimal' });
```

## Formatting Details

### Indentation

- Base level (project): 0 spaces
- Property/Category level: 2 spaces
- Change items: 4 spaces (within property block)

### Prefix Symbols

- `+` = Addition (green)
- `-` = Removal (red)
- `~` = Flipped/Updated (yellow, for booleans)

### Value Formatting

- **Arrays**: Set diff format with `+`/`-` prefixes, sorted alphabetically
- **Booleans**: Grouped by category, shown as flag names with `+`/`-`/`~` prefixes
- **Scalars**: Focused diff with `-` old value and `+` new value
- **No-ops**: Can optionally show `(unchanged – N entries)` for context

## Best Practices

1. **Use appropriate themes**: Choose minimal for CI, default for local development
2. **Customize per baseline type**: Different file types can have different formatting
3. **Per-project view**: Changes are shown per project, no cross-project aggregation
4. **Semantic grouping**: Arrays show set diffs, booleans are grouped, scalars are focused
5. **No repetition**: Each property appears once per project

## Examples

### Complete Example

```
tsconfig out of sync: tsconfig.spec.json

local-action
  include
    + vite.config.ts
    + vite.config.mts
    + vitest.config.ts
    + vitest.config.mts
    + vitest.unit.config.ts
    + src/**/*.{spec,test}.{ts,tsx,js,jsx}
    + src/**/*.d.ts
    + ../../testing/test-setup/src/vitest.d.ts

  compilerOptions
    + strict
    + noImplicitReturns
    + noFallthroughCasesInSwitch
    + noImplicitOverride
    + noPropertyAccessFromIndexSignature

  compilerOptions.module
    - CommonJS
    + ESNext

---

tsconfig out of sync: tsconfig.lib.json

eslint-formatter-multi
  compilerOptions.types
    + vitest/globals
    + vitest/importMeta
    + vite/client
    + node

  compilerOptions.outDir
    - undefined
    + ../../dist/out-tsc

  extends
    - ../../tsconfig.base.json
    + ./tsconfig.json
```
