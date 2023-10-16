# @code-pushup/models

Model definitions and validators for the [Code PushUp CLI](../cli/README.md).

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
import { coreConfigSchema } from '@code-pushup/models';
import { readJsonFile } from '@code-pushup/utils';

const json = await readJsonFile('code-pushup.config.json');
const config = coreConfigSchema.parse(json); // throws ZodError if invalid
```
