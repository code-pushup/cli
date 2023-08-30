# models

Model definitions for the CLI configuration as well as plugin types and respective parser.

## Usage

```ts
import { CoreConfigSchema, pluginConfigSchema } from '@qm/cli-models';

export default {
  // ...
  plugins: [pluginConfigSchema.parse({ ... })],
} satisfies CoreConfigSchema;
```
