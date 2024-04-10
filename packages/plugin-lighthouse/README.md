# @code-pushup/lighthouse-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Flighthouse-plugin.svg)](https://www.npmjs.com/package/@code-pushup/lighthouse-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Flighthouse-plugin)](https://npmtrends.com/@code-pushup/lighthouse-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/lighthouse-plugin)](https://www.npmjs.com/package/@code-pushup/lighthouse-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring web performance and quality with Lighthouse.** 🔥

---

The plugin parses your Lighthouse configuration and lints all audits of the official [Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md#lighthouse-------) CLI.

Detected Lighthouse audits are mapped to Code PushUp audits. Audit reports are calculated based on the [original implementation](https://googlechrome.github.io/lighthouse/scorecalc/).
Additionally, Lighthouse categories are mapped to Code PushUp groups which can make it easier to assemble the categories.

For more infos visit the [official docs](https://developer.chrome.com/docs/lighthouse/overview).

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/lighthouse-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/lighthouse-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/lighthouse-plugin
   ```

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.ts`).

   Pass in the URL you want to measure, along with optional [flags](#flags) and [config](#config) data.

   ```ts
   import lighthousePlugin from '@code-pushup/lighthouse-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await lighthousePlugin('https://example.com'),
     ],
   };
   ```

4. Run the CLI with `npx code-pushup collect` and view or upload the report (refer to [CLI docs](../cli/README.md)).

### Optionally set up categories

Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config --onlyPlugins=lighthouse` to list audits and groups).

Assign weights based on what influence each Lighthouse audit has on the overall category score (assign weight 0 to only include as extra info, without influencing category score).
The plugin exports the helper `lighthouseAuditRef` and `lighthouseGroupRef` to reference Lighthouse category references for audits and groups.

#### Reference audits directly with `lighthouseGroupRef`

```ts
import { lighthouseGroupRef } from './utils';

export default {
  // ...
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [lighthouseGroupRef('performance')],
    },
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [lighthouseGroupRef('accessibility')],
    },
    {
      slug: 'best-practices',
      title: 'Best Practices',
      refs: [lighthouseGroupRef('best-practices')],
    },
    {
      slug: 'seo',
      title: 'SEO',
      refs: [lighthouseGroupRef('seo')],
    },
    {
      slug: 'pwa',
      title: 'PWA',
      isBinary: true,
      refs: [lighthouseGroupRef('pwa')],
    },
  ],
};
```

#### Reference groups with `lighthouseAuditRef`

The Lighthouse categories are reflected as groups.
Referencing individual audits offers more granularity. However, keep maintenance costs of a higher number of audits in mind as well.

```ts
import { lighthouseAuditRef } from './utils';

export default {
  // ...
  categories: [
    {
      slug: 'pwa',
      title: 'PWA',
      isBinary: true,
      refs: [lighthouseAuditRef('installable-manifest', 2), lighthouseAuditRef('splash-screen', 1), lighthouseAuditRef('themed-omnibox', 1), lighthouseAuditRef('content-width', 1), lighthouseAuditRef('themed-omnibox', 2), lighthouseAuditRef('viewport', 2), lighthouseAuditRef('maskable-icon', 1), lighthouseAuditRef('pwa-cross-browser', 0), lighthouseAuditRef('pwa-page-transitions', 0), lighthouseAuditRef('pwa-each-page-has-url', 0)],
    },
  ],
};
```

## Flags

The plugin accepts a second optional argument, `flags`.

`flags` is the Lighthouse [CLI flags](https://github.com/GoogleChrome/lighthouse/blob/7d80178c37a1b600ea8f092fc0b098029799a659/cli/cli-flags.js#L80) as a JS object.

Within the flags object a couple of other external configuration files can be referenced. E.g. `configPath` , `preset` or `budgetPath` reference external `json` or JavaScript files.

For a complete list the [official documentation of CLI flags](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md#cli-options)

> [!TIP]  
> If you are not used to work with the Lighthouse CLI you would pass flags like this:
> `lighthouse https://example.com --output=json --chromeFlags='--headless=shell'`
>
> Now with the plugin it would look like this:
>
> ```ts
> // code-pushup.config.ts
> ...
> lighthousePlugin('https://example.com', { output: 'json', chromeFlags: ['--headless=shell']});
> ```

> [!note]
> The following flags are **not supported** in the current implementation:
>
> - `list-all-audits` - Prints a list of all available audits and exits. Alternative: `npx code-pushup print-config --onlyPlugins lighthouse`
> - `list-locales` - Prints a list of all supported locales and exits.
> - `list-trace-categories` - Prints a list of all required trace categories and exits.
> - `view` - Open HTML report in your browser

## Config

The plugin accepts a third optional argument, `config`.

`config` is the Lighthouse [configuration](https://github.com/GoogleChrome/lighthouse/blob/7d80178c37a1b600ea8f092fc0b098029799a659/types/config.d.ts#L21) as a JS object.

For a complete guide on Lighthouse configuration read the [official documentation on configuring](https://github.com/GoogleChrome/lighthouse/blob/main/docs/configuration.md)

> [!TIP]  
> If you are not used to work with the Lighthouse CLI you would pass a config like this:
> `lighthouse --config-path=path/to/custom-config.js https://example.com`
>
> And in a separate file you would place the following object:
>
> ```typescript
> // custom-config.js file
> export default {
>   extends: 'lighthouse:default',
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
> lighthousePlugin('https://example.com', undefined, {
>   extends: 'lighthouse:default',
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
