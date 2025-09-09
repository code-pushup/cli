# @code-pushup/bundle-stats-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fbundle-stats-plugin.svg)](https://www.npmjs.com/package/@code-pushup/bundle-stats-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fbundle-stats-plugin)](https://npmtrends.com/@code-pushup/bundle-stats-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/bundle-stats-plugin)](https://www.npmjs.com/package/@code-pushup/bundle-stats-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring bundle size and show insights in tables and import trees.** 🔥

---

This plugin analyzes your build output from modern bundlers to provide detailed bundle size insights and help you track bundle optimization over time. It supports multiple bundlers and provides configurable thresholds for monitoring bundle size targets.

Bundle statistics are mapped to Code PushUp audits in the following way:

- **Value**: Total bundle size in bytes for the analyzed configuration
- **Score**: Calculated based on size thresholds with penalties for oversized artifacts
- **Display Value**: Human-readable bundle size (e.g., "2.5 MB")
- **Issues**: Detailed warnings and errors for bundles exceeding thresholds

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/bundle-stats-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/bundle-stats-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/bundle-stats-plugin
   ```
