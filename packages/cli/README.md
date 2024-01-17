# @code-pushup/cli

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

---

|                  📊 Getting Started                  |               🌐 Portal Integration                |              🛠️ CI Automation              |
| :--------------------------------------------------: | :------------------------------------------------: | :----------------------------------------: |
| **[How to setup](#getting-started)** a basic project | Sort, filter **[your goals](#portal-integration)** | Updates **[on every PR](#-ci-automation)** |

---

The Code PushUp CLI serves to **collect audit results**, and optionally **upload the report** to the Code PushUp portal.

It can be used locally in your repository, or integrated in your CI environment.

_If you're looking for programmatic usage, then refer to the underlying [@code-pushup/core](../core/README.md) package instead._

## Getting started

1. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/cli
   ```

   ```sh
   yarn add --dev @code-pushup/cli
   ```

   ```sh
   pnpm add --save-dev @code-pushup/cli
   ```

2. Create a `code-pushup.config.js` configuration file (`.ts` or `.mjs` extensions are also supported).

   ```js
   export default {
     persist: {
       outputDir: '.code-pushup',
       format: ['json', 'md'],
     },
     plugins: [
       // ...
     ],
     categories: [
       // ...
     ],
   };
   ```

3. Add plugins as per your project needs (e.g. [@code-pushup/eslint-plugin](../plugin-eslint/README.md)).

   ```sh
   npm install --save-dev @code-pushup/eslint-plugin
   ```

   ```js
   import eslintPlugin from '@code-pushup/eslint-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await eslintPlugin({ eslintrc: '.eslintrc.js', patterns: ['src/**/*.js'] }),
     ],
   };
   ```

4. Define your custom categories.

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'performance',
         title: 'Performance',
         refs: [
           {
             type: 'audit',
             plugin: 'eslint',
             slug: 'react-jsx-key',
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
   };
   ```

5. Run the CLI with `npx code-pushup` (see `--help` for list of commands and arguments).

6. View report file(s) in output directory (specified by `persist.outputDir` configuration).

## Portal integration

If you have access to the Code PushUp portal, provide credentials in order to upload reports.

```js
export default {
  // ...
  upload: {
    server: 'https://ip-or-domain/path/to/portal/api/graphql',
    apiKey: process.env.PORTAL_API_KEY,
    organization: 'my-org',
    project: 'my-project',
  },
};
```

## 🛠 CI automation

Example for GitHub Actions:

```yml
name: Code PushUp

on: push

jobs:
  collect-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx code-pushup autorun --upload.apiKey=${{ secrets.PORTAL_API_KEY }}
```

## Custom Plugins

We provide comprehensive documentation on [how to create a custom plugin](./docs/custom-plugins.md).

The repository also maintains a set of plugin examples showcasing different scenarios.  
Each example is fully tested to give demonstrate best practices for plugin testing.

**Example for custom plugins:**

- 📏 [File Size](../../examples/plugins/src/file-size)
- 📦 [Package Json](../../examples/plugins/src/package-json)
- 🔥 [Lighthouse](../../examples/plugins/src/lighthouse)

## CLI commands and options

### Global Options

| Option           | Type      | Default                 | Description                                                            |
| ---------------- | --------- | ----------------------- | ---------------------------------------------------------------------- |
| **`--progress`** | `boolean` | `true`                  | Show progress bar in stdout.                                           |
| **`--verbose`**  | `boolean` | `false`                 | When true creates more verbose output. This is helpful when debugging. |
| **`--config`**   | `string`  | `code-pushup.config.js` | Path to the config file, e.g. code-pushup.config.js                    |

### Common Command Options

| Option                      | Type                 | Default  | Description                                                                 |
| --------------------------- | -------------------- | -------- | --------------------------------------------------------------------------- |
| **`--persist.outputDir`**   | `string`             | n/a      | Directory for the produced reports.                                         |
| **`--persist.filename`**    | `string`             | `report` | Filename for the produced reports without extension.                        |
| **`--persist.format`**      | `('json' \| 'md')[]` | `json`   | Format(s) of the report file.                                               |
| **`--upload.organization`** | `string`             | n/a      | Organization slug from portal.                                              |
| **`--upload.project`**      | `string`             | n/a      | Project slug from portal.                                                   |
| **`--upload.server`**       | `string`             | n/a      | URL to your portal server.                                                  |
| **`--upload.apiKey`**       | `string`             | n/a      | API key for the portal server.                                              |
| **`--onlyPlugins`**         | `string[]`           | `[]`     | Only run the specified plugins. Applicable to all commands except `upload`. |

> [!NOTE]  
> All common options, expect `--onlyPlugins`, can be specified in the configuration file as well.
> CLI arguments take precedence over configuration file options.

> [!NOTE]
> The `--upload.*` group of options is applicable to all commands except `collect`.

### Commands

#### `collect` command

Usage:
`code-pushup collect [options]`

Description:
The command initializes the necessary plugins, runs them, and then collects the results. After collecting the results, it generates a comprehensive report.

Refer to the [Common Command Options](#common-command-options) for the list of available options.

#### `upload` command

Usage:
`code-pushup upload [options]`

Description:
Upload reports to the Code PushUp portal.

Refer to the [Common Command Options](#common-command-options) for the list of available options.

#### `autorun` command

Usage:
`code-pushup autorun [options]`

Description:
Run plugins, collect results and upload report to the Code PushUp portal.

Refer to the [Common Command Options](#common-command-options) for the list of available options.

#### `print-config` command

Usage:
`code-pushup print-config [options]`

Description:
Print the resolved configuration.

Refer to the [Common Command Options](#common-command-options) for the list of available options.
