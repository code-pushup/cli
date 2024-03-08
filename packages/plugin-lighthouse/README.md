# @code-pushup/lighthouse-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Flighthouse-plugin.svg)](https://www.npmjs.com/package/@code-pushup/lighthouse-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Flighthouse-plugin)](https://npmtrends.com/@code-pushup/lighthouse-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/lighthouse-plugin)](https://www.npmjs.com/package/@code-pushup/lighthouse-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for running lighthouse performance tests.** 📋

---

The plugin parses your lighthouse configuration and lints all audits of the official [lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md#lighthouse-------).

Detected lighthouse audits are mapped to Code PushUp audits. Audit reports are calculated based on the [original implementation](https://googlechrome.github.io/lighthouse/scorecalc/).

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

   Pass in the path to your ESLint config file, along with glob patterns for which files you wish to target (relative to `process.cwd()`).

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

4. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

### Optionally set up categories

@TODO
