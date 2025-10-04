# @code-pushup/models

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fmodels.svg)](https://www.npmjs.com/package/@code-pushup/models)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fmodels)](https://npmtrends.com/@code-pushup/models)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/models)](https://www.npmjs.com/package/@code-pushup/models?activeTab=dependencies)

**Model definitions and validators** for the [Code PushUp CLI](../cli/README.md).

For a full list of models defined by this package, see the auto-generated [Code PushUp models reference](./docs/models-reference.md).

## Setup

If you've already installed another `@code-pushup/*` package, then you may have already installed `@code-pushup/models` indirectly.

If not, you can always install it separately:

```sh
npm install --save-dev @code-pushup/models
```

```sh
yarn add --dev @code-pushup/models
```

```sh
pnpm add --save-dev @code-pushup/models
```

## Usage

### Importing Everything (Traditional)

Import the type definitions if using TypeScript:

- in `code-pushup.config.ts`:

  ```ts
  import type { CoreConfig } from '@code-pushup/models';

  export default {
    // ... this is type-checked ...
  } satisfies CoreConfig;
  ```

- in custom plugin:

  ```ts
  import type { PluginConfig } from '@code-pushup/models';

  export default function myCustomPlugin(): PluginConfig {
    return {
      // ... this is type-checked ...
    };
  }
  ```

  ```ts
  import type { AuditOutput } from '@code-pushup/models';

  async function myCustomPluginRunner() {
    const audits: AuditOutput[] = await collectAudits();

    await writeFile(RUNNER_OUTPUT_FILE, JSON.stringify(audits));
  }
  ```

### Importing Specific Modules (Recommended)

For better tree-shaking and smaller bundle sizes, import only what you need from specific modules:

```ts
// Import only audit-related models
import { auditSchema } from '@code-pushup/models/audit';
import type { AuditOutput } from '@code-pushup/models/audit-output';
// Import only configuration models
import type { CoreConfig } from '@code-pushup/models/core-config';
import { persistConfigSchema } from '@code-pushup/models/persist-config';
// Import only plugin-related models
import type { PluginConfig } from '@code-pushup/models/plugin-config';
// Import only report-related models
import type { Report } from '@code-pushup/models/report';
import { reportsDiffSchema } from '@code-pushup/models/reports-diff';
```

### Available Entry Points

The following modules are available as individual entry points:

| Module          | Import Path                           | Description                   |
| --------------- | ------------------------------------- | ----------------------------- |
| Audit           | `@code-pushup/models/audit`           | Audit definitions and schemas |
| Audit Output    | `@code-pushup/models/audit-output`    | Audit output models           |
| Cache Config    | `@code-pushup/models/cache-config`    | Cache configuration models    |
| Category Config | `@code-pushup/models/category-config` | Category configuration models |
| Commit          | `@code-pushup/models/commit`          | Commit-related models         |
| Configuration   | `@code-pushup/models/configuration`   | General configuration models  |
| Core Config     | `@code-pushup/models/core-config`     | Core configuration models     |
| Group           | `@code-pushup/models/group`           | Group-related models          |
| Issue           | `@code-pushup/models/issue`           | Issue definitions and schemas |
| Persist Config  | `@code-pushup/models/persist-config`  | Persist configuration models  |
| Plugin Config   | `@code-pushup/models/plugin-config`   | Plugin configuration models   |
| Report          | `@code-pushup/models/report`          | Report models                 |
| Reports Diff    | `@code-pushup/models/reports-diff`    | Report diff models            |
| Runner Config   | `@code-pushup/models/runner-config`   | Runner configuration models   |
| Source          | `@code-pushup/models/source`          | Source location models        |
| Table           | `@code-pushup/models/table`           | Table formatting models       |
| Tree            | `@code-pushup/models/tree`            | Tree structure models         |
| Upload Config   | `@code-pushup/models/upload-config`   | Upload configuration models   |

### Runtime Validation

If you need runtime validation, use the underlying Zod schemas:

```ts
// Import from specific modules (recommended)
import { coreConfigSchema } from '@code-pushup/models/core-config';
import { auditOutputSchema } from '@code-pushup/models/audit-output';

// Or import from main entry point
import { coreConfigSchema } from '@code-pushup/models';

const json = JSON.parse(readFileSync('code-pushup.config.json'));
const config = coreConfigSchema.parse(json); // throws ZodError if invalid
```

> **💡 Pro tip**: Using specific module imports (e.g., `@code-pushup/models/audit`) instead of the main entry point can significantly reduce your bundle size and avoid side effects by only including the code you actually use.
