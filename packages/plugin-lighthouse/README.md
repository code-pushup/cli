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

## Multiple URLs

The Lighthouse plugin supports running audits against multiple URLs in a single invocation. To do this, provide an array of URLs as the first argument to the plugin:

```ts
import lighthousePlugin from '@code-pushup/lighthouse-plugin';

export default {
  // ...
  plugins: [
    // ...
    await lighthousePlugin(['https://example.com', 'https://example.com/contact']),
  ],
};
```

### Assigning weights to URLs

You can assign custom weights to URLs by passing an object instead of an array. This is useful when some pages are more important than others (e.g., your homepage vs. a contact page). The keys are URLs, and the values are their weights.

URLs with higher weights contribute more to the overall category scores. For example, a URL with weight 2 has twice the influence of a URL with weight 1.

```ts
import lighthousePlugin from '@code-pushup/lighthouse-plugin';

export default {
  // ...
  plugins: [
    // ...
    await lighthousePlugin({
      'https://example.com': 2,
      'https://example.com/contact': 1,
    })
  ];
};
```

## Flags

The plugin accepts an optional second argument, `flags`.

`flags` is a JavaScript object containing Lighthouse [CLI flags](https://github.com/GoogleChrome/lighthouse/blob/7d80178c37a1b600ea8f092fc0b098029799a659/cli/cli-flags.js#L80).

Within the `flags` object, external configuration files can be referenced using options like `configPath` , `preset`, or `budgetPath`. These options allow Lighthouse to load custom configurations, audit presets, or performance budgets from external `json` or JavaScript files.

For a complete list of available options, refer to [the official Lighthouse documentation](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md#cli-options).

> [!TIP]  
> If you are new to working with the Lighthouse CLI, flags can be passed like this:
> `lighthouse https://example.com --output=json --chromeFlags='--headless=shell'`
>
> With the plugin, the configuration would be:
>
> ```ts
> // code-pushup.config.ts
> ...
> lighthousePlugin('https://example.com', {
>   output: 'json',
>   chromeFlags: ['--headless=shell'],
> });
> ```

> [!note]
> The following flags are **not supported** in the current implementation:
>
> - `list-all-audits` - Prints a list of all available audits and exits. Alternative: `npx code-pushup print-config --onlyPlugins lighthouse`
> - `list-locales` - Prints a list of all supported locales and exits.
> - `list-trace-categories` - Prints a list of all required trace categories and exits.
> - `view` - Open HTML report in your browser

## Chrome Flags for Tooling

We recommend using Chrome flags for more stable runs in a tooling environment. The [`chrome-launcher`](https://www.npmjs.com/package/chrome-launcher) package offers a well-documented set of flags specifically designed to ensure reliable execution.

The latest version of `@code-pushup/lighthouse-plugin` provides `DEFAULT_CHROME_FLAGS`, a pre-configured constant that includes Chrome’s default flags for stable, headless execution out of the box. This means you do not need to specify `chromeFlags` manually unless you want to modify them.

### Default Usage

If no `chromeFlags` are provided, the plugin automatically applies the default configuration:

> ```ts
> import lighthousePlugin from '@code-pushup/lighthouse-plugin';
>
> lighthousePlugin('https://example.com', {
>   output: 'json',
>   // Defaults to DEFAULT_CHROME_FLAGS internally
> });
> ```

### Adding Extra Flags

If additional Chrome flags are required (e.g., verbose logging or debugging), they can be appended to the default flags:

> ```ts
> import lighthousePlugin, { DEFAULT_CHROME_FLAGS } from '@code-pushup/lighthouse-plugin';
>
> lighthousePlugin('https://example.com', {
>   output: 'json',
>   chromeFlags: DEFAULT_CHROME_FLAGS.concat(['--verbose']),
> });
> ```

### Overriding Default Flags

To completely override the default flags and provide a custom configuration:

> ```ts
> import lighthousePlugin from '@code-pushup/lighthouse-plugin';
>
> lighthousePlugin('https://example.com', {
>   output: 'json',
>   chromeFlags: ['--verbose'],
> });
> ```

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

## Category integration

The plugin provides helpers to integrate Lighthouse results into your categories.

### Building categories with ref helpers

Use `lighthouseGroupRefs` and `lighthouseAuditRefs` to build categories. These helpers automatically handle multi-URL expansion:

```ts
import lighthousePlugin, { lighthouseGroupRefs } from '@code-pushup/lighthouse-plugin';

const lighthouse = await lighthousePlugin('https://example.com');

export default {
  plugins: [lighthouse],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: lighthouseGroupRefs(lighthouse, 'performance'),
    },
    {
      slug: 'seo',
      title: 'SEO',
      refs: lighthouseGroupRefs(lighthouse, 'seo'),
    },
  ],
};
```

For multi-URL setups, refs are automatically expanded for each URL with appropriate weights:

```ts
import lighthousePlugin, { lighthouseAuditRefs, lighthouseGroupRefs } from '@code-pushup/lighthouse-plugin';

const lighthouse = await lighthousePlugin({
  'https://example.com': 2,
  'https://example.com/about': 1,
});

export default {
  plugins: [lighthouse],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: lighthouseGroupRefs(lighthouse, 'performance'),
    },
    {
      slug: 'core-web-vitals',
      title: 'Core Web Vitals',
      refs: [...lighthouseAuditRefs(lighthouse, 'largest-contentful-paint', 3), ...lighthouseAuditRefs(lighthouse, 'cumulative-layout-shift', 2), ...lighthouseAuditRefs(lighthouse, 'first-contentful-paint', 1)],
    },
  ],
};
```

### Get all groups

Call `lighthouseGroupRefs` without a slug to get refs for all Lighthouse groups:

```ts
import lighthousePlugin, { lighthouseGroupRefs } from '@code-pushup/lighthouse-plugin';

const lighthouse = await lighthousePlugin('https://example.com');

export default {
  plugins: [lighthouse],
  categories: [
    {
      slug: 'lighthouse',
      title: 'Lighthouse',
      refs: lighthouseGroupRefs(lighthouse), // all groups
    },
  ],
};
```

### Helper functions

| Function              | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `lighthouseGroupRefs` | Creates category refs to Lighthouse group(s), handles multi-URL |
| `lighthouseAuditRefs` | Creates category refs to Lighthouse audit(s), handles multi-URL |

> [!NOTE]
> Referencing individual audits offers more granularity but increases maintenance costs. Use `npx code-pushup print-config --onlyPlugins=lighthouse` to list all available audits and groups.

> [!TIP]
> Weights determine each ref's influence on the category score. Use weight `0` to include a ref as info only, without affecting the score.

### Type safety

The `LighthouseGroupSlug` type is exported for discovering valid group slugs:

```ts
import type { LighthouseGroupSlug } from '@code-pushup/lighthouse-plugin';

const group: LighthouseGroupSlug = 'performance';
```

### Deprecated helpers

The following helpers are deprecated and will be removed in a future version:

| Function               | Replacement                                              |
| ---------------------- | -------------------------------------------------------- |
| `lighthouseCategories` | Build categories manually with `lighthouseGroupRefs`     |
| `lighthouseGroupRef`   | Use `lighthouseGroupRefs` (plural) for multi-URL support |
| `lighthouseAuditRef`   | Use `lighthouseAuditRefs` (plural) for multi-URL support |

If you want to contribute, please refer to [CONTRIBUTING.md](./CONTRIBUTING.md).
