# @code-pushup/typescript-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Ftypescript-plugin.svg)](https://www.npmjs.com/package/@code-pushup/typescript-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Ftypescript-plugin)](https://npmtrends.com/@code-pushup/typescript-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/typescript-plugin)](https://www.npmjs.com/package/@code-pushup/typescript-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring web performance and quality with Lighthouse.** 🔥

---

The plugin parses your Lighthouse configuration and lints all audits of the official [Lighthouse](https://github.com/GoogleChrome/typescript/blob/main/readme.md#typescript-------) CLI.

Detected Lighthouse audits are mapped to Code PushUp audits. Audit reports are calculated based on the [original implementation](https://googlechrome.github.io/typescript/scorecalc/).
Additionally, Lighthouse categories are mapped to Code PushUp groups which can make it easier to assemble the categories.

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
       await typescriptPlugin('https://example.com'),
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
    {
      slug: 'performance',
      title: 'Performance',
      refs: [typescriptGroupRef('performance')],
    },
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [typescriptGroupRef('accessibility')],
    },
    {
      slug: 'best-practices',
      title: 'Best Practices',
      refs: [typescriptGroupRef('best-practices')],
    },
    {
      slug: 'seo',
      title: 'SEO',
      refs: [typescriptGroupRef('seo')],
    },
    {
      slug: 'pwa',
      title: 'PWA',
      isBinary: true,
      refs: [typescriptGroupRef('pwa')],
    },
  ],
};
```

#### Reference groups with `typescriptAuditRef`

The Lighthouse categories are reflected as groups.
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

## Flags

The plugin accepts an optional second argument, `flags`.

`flags` is a JavaScript object containing Lighthouse [CLI flags](https://github.com/GoogleChrome/typescript/blob/7d80178c37a1b600ea8f092fc0b098029799a659/cli/cli-flags.js#L80).

Within the `flags` object, external configuration files can be referenced using options like `configPath` , `preset`, or `budgetPath`. These options allow Lighthouse to load custom configurations, audit presets, or performance budgets from external `json` or JavaScript files.

For a complete list of available options, refer to [the official Lighthouse documentation](https://github.com/GoogleChrome/typescript/blob/main/readme.md#cli-options).

> [!TIP]  
> If you are new to working with the Lighthouse CLI, flags can be passed like this:
> `typescript https://example.com --output=json --chromeFlags='--headless=shell'`
>
> With the plugin, the configuration would be:
>
> ```ts
> // code-pushup.config.ts
> ...
> typescriptPlugin('https://example.com', {
>   output: 'json',
>   chromeFlags: ['--headless=shell'],
> });
> ```

> [!note]
> The following flags are **not supported** in the current implementation:
>
> - `list-all-audits` - Prints a list of all available audits and exits. Alternative: `npx code-pushup print-config --onlyPlugins typescript`
> - `list-locales` - Prints a list of all supported locales and exits.
> - `list-trace-categories` - Prints a list of all required trace categories and exits.
> - `view` - Open HTML report in your browser

## Chrome Flags for Tooling

We recommend using Chrome flags for more stable runs in a tooling environment. The [`chrome-launcher`](https://www.npmjs.com/package/chrome-launcher) package offers a well-documented set of flags specifically designed to ensure reliable execution.

The latest version of `@code-pushup/typescript-plugin` provides `DEFAULT_CHROME_FLAGS`, a pre-configured constant that includes Chrome’s default flags for stable, headless execution out of the box. This means you do not need to specify `chromeFlags` manually unless you want to modify them.

### Default Usage

If no `chromeFlags` are provided, the plugin automatically applies the default configuration:

> ```ts
> import typescriptPlugin from '@code-pushup/typescript-plugin';
>
> typescriptPlugin('https://example.com', {
>   output: 'json',
>   // Defaults to DEFAULT_CHROME_FLAGS internally
> });
> ```

### Adding Extra Flags

If additional Chrome flags are required (e.g., verbose logging or debugging), they can be appended to the default flags:

> ```ts
> import typescriptPlugin, { DEFAULT_CHROME_FLAGS } from '@code-pushup/typescript-plugin';
>
> typescriptPlugin('https://example.com', {
>   output: 'json',
>   chromeFlags: DEFAULT_CHROME_FLAGS.concat(['--verbose']),
> });
> ```

### Overriding Default Flags

To completely override the default flags and provide a custom configuration:

> ```ts
> import typescriptPlugin from '@code-pushup/typescript-plugin';
>
> typescriptPlugin('https://example.com', {
>   output: 'json',
>   chromeFlags: ['--verbose'],
> });
> ```

## Config

The plugin accepts a third optional argument, `config`.

`config` is the Lighthouse [configuration](https://github.com/GoogleChrome/typescript/blob/7d80178c37a1b600ea8f092fc0b098029799a659/types/config.d.ts#L21) as a JS object.

For a complete guide on Lighthouse configuration read the [official documentation on configuring](https://github.com/GoogleChrome/typescript/blob/main/docs/configuration.md)

> [!TIP]  
> If you are not used to work with the Lighthouse CLI you would pass a config like this:
> `typescript --config-path=path/to/custom-config.js https://example.com`
>
> And in a separate file you would place the following object:
>
> ```typescript
> // custom-config.js file
> export default {
>   extends: 'typescript:default',
>   settings: {
>     onlyAudits: ['first-meaningful-paint', 'speed-index', 'interactive'],
>   },
> };
> ```
>
> Now with the plugin it would look like this:
>
> ```ts
> // code-pushup.config.ts
> ...
> typescriptPlugin('https://example.com', undefined, {
>   extends: 'typescript:default',
>   settings: {
>     onlyAudits: [
>       'first-meaningful-paint',
>       'speed-index',
>       'interactive',
>      ],
>  }
> })
> ```

If you want to contribute, please refer to [CONTRIBUTING.md](./CONTRIBUTING.md).
