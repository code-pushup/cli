# @code-pushup/axe-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Faxe-plugin.svg)](https://www.npmjs.com/package/@code-pushup/axe-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Faxe-plugin)](https://npmtrends.com/@code-pushup/axe-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/axe-plugin)](https://www.npmjs.com/package/@code-pushup/axe-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for automated accessibility testing with Axe.** 🌐

---

The plugin runs accessibility audits on web pages using [axe-core](https://github.com/dequelabs/axe-core) via Playwright. It identifies [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) violations and best practice recommendations, providing **100+ accessibility metrics** with detailed guidance for fixing problems.

**Why accessibility testing matters:** The [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202) requires digital products and services in the EU to meet accessibility standards closely aligned with the Web Content Accessibility Guidelines (WCAG). This plugin provides comprehensive automated testing to help meet compliance requirements and build inclusive experiences.

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/axe-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/axe-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/axe-plugin
   ```

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.ts`).

   Pass in the URL you want to test:

   ```ts
   import axePlugin from '@code-pushup/axe-plugin';

   export default {
     // ...
     plugins: [
       // ...
       axePlugin('https://example.com'),
     ],
   };
   ```

   By default, the plugin runs **WCAG 2.1 Level AA** audits. You can customize this using [presets](#presets).

4. Run the CLI with `npx code-pushup collect` and view or upload the report (refer to [CLI docs](../cli/README.md)).

   > **Note:** The plugin uses Playwright to run tests in Chromium. The browser will be installed automatically if not already present.

## Configuration

```ts
axePlugin(urls: PluginUrls, options?: AxePluginOptions)
```

**Parameters:**

- `urls` - URL(s) to test. See [Multiple URLs](#multiple-urls) section below, or [`PluginUrls`](../../packages/models/docs/models-reference.md#pluginurls) reference
- `options` - Optional configuration object

**Options:**

| Property       | Type        | Default      | Description                               |
| -------------- | ----------- | ------------ | ----------------------------------------- |
| `preset`       | `AxePreset` | `'wcag21aa'` | Accessibility ruleset preset              |
| `setupScript`  | `string`    | `undefined`  | Path to authentication setup script       |
| `scoreTargets` | `object`    | `undefined`  | Pass/fail thresholds for audits or groups |

See [Presets](#presets) and [Authentication](#authentication) sections below.

## Multiple URLs

The plugin supports testing single or multiple URLs:

```ts
// Single URL (string)
axePlugin('https://example.com');

// Multiple URLs (array)
axePlugin(['https://example.com', 'https://example.com/about']);

// Weighted URLs (record)
axePlugin({
  'https://example.com': 3, // homepage has 3x weight
  'https://example.com/about': 1, // about page has 1x weight
});
```

URLs with higher weights contribute more to overall scores. For example, a URL with weight 3 has three times the influence of a URL with weight 1.

## Authentication

To test login-protected pages, provide a `setupScript` that authenticates before analysis:

```ts
axePlugin('https://example.com/dashboard', {
  setupScript: './axe-setup.ts',
});
```

The setup script must export a default async function that receives a Playwright `Page` instance:

```ts
// axe-setup.ts
import type { Page } from 'playwright-core';

export default async function (page: Page): Promise<void> {
  await page.goto('https://example.com/login');
  await page.fill('#username', process.env.USERNAME);
  await page.fill('#password', process.env.PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}
```

The script runs once before analyzing URLs. Authentication state (cookies, localStorage) is automatically shared across all URL analyses.

<details>
<summary>Alternative: Cookie-based authentication</summary>

If you have a session token, you can inject it directly via cookies:

```ts
// axe-setup.ts
import type { Page } from 'playwright-core';

export default async function (page: Page): Promise<void> {
  await page.context().addCookies([
    {
      name: 'session_token',
      value: process.env.SESSION_TOKEN,
      domain: 'example.com',
      path: '/',
    },
  ]);
}
```

</details>

## Presets

Choose which accessibility ruleset to test against using the `preset` option:

```ts
axePlugin('https://example.com', {
  preset: 'wcag22aa',
});
```

Available presets:

| Preset          | Description                                   | Use case                              |
| --------------- | --------------------------------------------- | ------------------------------------- |
| `wcag21aa`      | **WCAG 2.1 Level A and AA** (default)         | Standard web accessibility compliance |
| `wcag22aa`      | **WCAG 2.2 Level A and AA**                   | Latest WCAG standard                  |
| `best-practice` | **Best practices** (non-WCAG recommendations) | Deque's additional recommendations    |
| `all`           | **All available rules**                       | Comprehensive testing                 |

### Preset details

**`wcag21aa`** (default)

- Tests compliance with [WCAG 2.1 Level A and Level AA](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_overview&levels=a%2Caaa)
- Required for [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202) compliance
- Covers fundamentals: keyboard navigation, color contrast, form labels, alt text, etc.

**`wcag22aa`**

- Tests compliance with [WCAG 2.2 Level A and Level AA](https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_overview&levels=a%2Caaa)
- Includes all WCAG 2.1 rules plus new success criteria
- Future-proof for upcoming regulations

**`best-practice`**

- Non-WCAG recommendations from Deque Systems
- Goes beyond legal requirements
- Helps create more inclusive experiences

**`all`**

- Runs every rule available in axe-core
- Includes WCAG 2.0, 2.1, 2.2, experimental rules, and best practices
- Most comprehensive testing

> **Note:** Different pages may trigger different sets of rules depending on their content. For example, a page without video won't run video-related audits.

### Groups

The plugin organizes audits into category groups based on axe-core's accessibility categories:

- `aria` - ARIA
- `color` - Color & Contrast
- `forms` - Forms
- `keyboard` - Keyboard
- `language` - Language
- `name-role-value` - Names & Labels
- `parsing` - Parsing
- `semantics` - Semantics
- `sensory-and-visual-cues` - Visual Cues
- `structure` - Structure
- `tables` - Tables
- `text-alternatives` - Text Alternatives
- `time-and-media` - Media

Use `npx code-pushup print-config --onlyPlugins=axe` to list all audits and groups for your configuration.

## Category integration

The plugin provides helpers to integrate Axe results into your categories.

### Building categories with ref helpers

Use `axeGroupRefs` and `axeAuditRefs` to build categories. These helpers automatically handle multi-URL expansion:

```ts
import axePlugin, { axeGroupRefs } from '@code-pushup/axe-plugin';

const axe = axePlugin('https://example.com');

export default {
  plugins: [axe],
  categories: [
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: axeGroupRefs(axe),
    },
  ],
};
```

For multi-URL setups, refs are automatically expanded for each URL with appropriate weights:

```ts
import axePlugin, { axeGroupRefs } from '@code-pushup/axe-plugin';

const axe = axePlugin({
  'https://example.com': 2,
  'https://example.com/about': 1,
});

export default {
  plugins: [axe],
  categories: [
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: axeGroupRefs(axe),
    },
  ],
};
```

### Custom categories with specific groups

For fine-grained control, specify which groups to include:

```ts
import axePlugin, { axeGroupRefs } from '@code-pushup/axe-plugin';

const axe = axePlugin('https://example.com');

export default {
  plugins: [axe],
  categories: [
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [...axeGroupRefs(axe, 'aria', 2), ...axeGroupRefs(axe, 'color'), ...axeGroupRefs(axe, 'keyboard')],
    },
  ],
};
```

### Combining with Lighthouse

For comprehensive accessibility testing, combine Axe with Lighthouse's accessibility group in a single category:

```ts
import axePlugin, { axeGroupRefs } from '@code-pushup/axe-plugin';
import lighthousePlugin, { lighthouseGroupRefs } from '@code-pushup/lighthouse-plugin';

const urls = ['https://example.com', 'https://example.com/about'];
const axe = axePlugin(urls);
const lighthouse = await lighthousePlugin(urls);

export default {
  plugins: [axe, lighthouse],
  categories: [
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [...lighthouseGroupRefs(lighthouse, 'accessibility'), ...axeGroupRefs(axe)],
    },
  ],
};
```

This gives you both Lighthouse's performance-focused accessibility audits and Axe's comprehensive WCAG coverage in one category score.

### Helper functions

| Function       | Description                                              |
| -------------- | -------------------------------------------------------- |
| `axeGroupRefs` | Creates category refs to Axe group(s), handles multi-URL |
| `axeAuditRefs` | Creates category refs to Axe audit(s), handles multi-URL |

> [!TIP]
> Weights determine each ref's influence on the category score. Use weight `0` to include a ref as info only, without affecting the score.

### Type safety

The `AxeGroupSlug` type is exported for discovering valid group slugs:

```ts
import type { AxeGroupSlug } from '@code-pushup/axe-plugin';

const group: AxeGroupSlug = 'aria';
```

### Deprecated helpers

The following helpers are deprecated and will be removed in a future version:

| Function        | Replacement                                       |
| --------------- | ------------------------------------------------- |
| `axeCategories` | Build categories manually with `axeGroupRefs`     |
| `axeGroupRef`   | Use `axeGroupRefs` (plural) for multi-URL support |
| `axeAuditRef`   | Use `axeAuditRefs` (plural) for multi-URL support |

## Resources

- **[Axe-core rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)** - Complete list of accessibility rules
- **[Deque University](https://dequeuniversity.com/rules/axe/)** - Detailed explanations and remediation guidance
- **[WCAG Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)** - Web Content Accessibility Guidelines
