# @code-pushup/bundle-stats-plugin

## Data Processing pipeline

1. `bundle-stats` plugin collects bundle stats from the build output.
2. `bundle-stats` plugin processes the stats and creates a unified tree.
3. `bundle-stats` plugin filters the tree by the config.
4. `bundle-stats` plugin creates a report.

## Data Processing pipeline

1. `bundle-stats` plugin collects bundle stats from the build output.

## Data

Great question — understanding the difference between imports and inputs is essential when analyzing bundler output (especially from tools like esbuild, webpack, or Rollup). Here's a clear breakdown:

# Bundle Stats Data Structure

## Imports vs Inputs

Understanding the difference between **imports** and **inputs** is essential when analyzing bundler output.

### 🔗 Imports

**What:** Links between output files (chunk-to-chunk dependencies)

**Example:**

```typescript
// dynamic import
import { something } from './shared.js';

// If main.js has these imports:
import('./route1'); // dynamic import
// static import
```

**ESBuild stats:**

```typescript
"main-TVMA6NI7.js": {
  imports: [
    { path: "chunk-5QRGP6BJ.js", kind: "import-statement" },
    { path: "chunk-NY7Q4ZJ6.js", kind: "dynamic-import" }
  ]
}
```

**Purpose:** Build dependency graph between chunks at runtime

### 📁 Inputs

**What:** Original source files bundled into a specific output

**Example:**

```typescript
// If main-TVMA6NI7.js was generated from:
// - src/main.ts
// - src/app/app.component.ts
// - node_modules/@angular/core/core.mjs
```

**ESBuild stats:**

```typescript
"main-TVMA6NI7.js": {
  inputs: {
    "src/main.ts": { bytesInOutput: 37 },
    "node_modules/@angular/router/router.mjs": { bytesInOutput: 64170 }
  }
}
```

**Purpose:** Analyze file contributions and size breakdown

### Summary

| Concept    | Meaning                        | Granularity    | Example                        |
| ---------- | ------------------------------ | -------------- | ------------------------------ |
| **Import** | Link to another output chunk   | Chunk-to-chunk | `main.js` → `route1.js`        |
| **Input**  | Source file bundled into chunk | File-to-chunk  | `src/main.ts`, `rxjs/index.js` |

> **💡 Quick tip:** Imports = dependency graph • Inputs = size analysis
