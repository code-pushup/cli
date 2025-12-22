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

    await writeFile(RUNNER_OUTPUT_FILE, JSON.strinfigy(audits));
  }
  ```

If you need runtime validation, use the underlying Zod schemas:

```ts
import { coreConfigSchema, validate } from '@code-pushup/models';

const json = JSON.parse(readFileSync('code-pushup.config.json'));
const config = validate(coreConfigSchema, json); // throws SchemaValidationError if invalid
```
