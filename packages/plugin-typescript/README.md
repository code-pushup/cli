# @code-pushup/typescript-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Ftypescript-plugin.svg)](https://www.npmjs.com/package/@code-pushup/typescript-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Ftypescript-plugin)](https://npmtrends.com/@code-pushup/typescript-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/typescript-plugin)](https://www.npmjs.com/package/@code-pushup/typescript-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring TypeScript quality with compiler diagnostics.** 🔥

---

The plugin parses your TypeScript and JavaScript code and lints all audits of the official [TypeScript Compiler]().

For more infos visit the [official docs](https://developer.chrome.com/docs/typescript/overview).

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/typescript-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/typescript-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/typescript-plugin
   ```

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.ts`).

   Pass in the URL you want to measure, along with optional [flags](#flags) and [config](#config) data.

   ```ts
   import typescriptPlugin from '@code-pushup/typescript-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await typescriptPlugin({
          tsConfigPath: './tsconfig.json'
       }),
     ],
   };
   ```

4. Run the CLI with `npx code-pushup collect` and view or upload the report (refer to [CLI docs](../cli/README.md)).

### Optionally set up categories

Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config --onlyPlugins=typescript` to list audits and groups).

Assign weights based on what influence each Lighthouse audit has on the overall category score (assign weight 0 to only include as extra info, without influencing category score).
The plugin exports the helper `typescriptAuditRef` and `typescriptGroupRef` to reference Lighthouse category references for audits and groups.

#### Reference audits directly with `typescriptGroupRef`

```ts
import { typescriptGroupRef } from './utils';

export default {
  // ...
  categories: [
    
  ],
};
```

#### Reference groups with `typescriptAuditRef`

The TypeScript categories are reflected as groups.
Referencing individual audits offers more granularity. However, keep maintenance costs of a higher number of audits in mind as well.

```ts
import { typescriptAuditRef } from './utils';

export default {
  // ...
  categories: [
    {
      slug: 'pwa',
      title: 'PWA',
      isBinary: true,
      refs: [typescriptAuditRef('installable-manifest', 2), typescriptAuditRef('splash-screen', 1), typescriptAuditRef('themed-omnibox', 1), typescriptAuditRef('content-width', 1), typescriptAuditRef('themed-omnibox', 2), typescriptAuditRef('viewport', 2), typescriptAuditRef('maskable-icon', 1), typescriptAuditRef('pwa-cross-browser', 0), typescriptAuditRef('pwa-page-transitions', 0), typescriptAuditRef('pwa-each-page-has-url', 0)],
    },
  ],
};
```
