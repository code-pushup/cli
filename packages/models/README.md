# models

Model definitions and validators for the CLI configuration as well as plugin types and respective parser.

## Usage

```ts
import { CoreConfigSchema, pluginConfigSchema } from '@code-pushup/models';

export default {
  // ...
  plugins: [pluginConfigSchema.parse({ ... })],
} satisfies CoreConfigSchema;
```
