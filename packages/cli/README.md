# @code-pushup/cli [![npm](https://img.shields.io/npm/v/%40code-pushup%2Fcli.svg)](https://www.npmjs.com/package/%40code-pushup%2Fcli)

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
   <details>
   <summary>Installation command for <code>npm</code>, <code>yarn</code> and <code>pnpm</code></summary>

   ```sh
   npm install --save-dev @code-pushup/cli
   ```

   ```sh
   yarn add --dev @code-pushup/cli
   ```

   ```sh
   pnpm add --save-dev @code-pushup/cli
   ```

   </details>

2. Create a `code-pushup.config.ts` configuration file (`.js` or `.mjs` extensions are also supported).

   ```ts
   import type { CoreConfig } from '@code-pushup/models';

   const config: CoreConfig = {
     plugins: [
       // ...
     ],
   };

   export default config;
   ```

3. Add plugins as per your project needs (e.g. [@code-pushup/eslint-plugin](../plugin-eslint/README.md) or [@code-pushup/coverage-plugin](../plugin-coverage/README.md)).

   ```sh
   npm install --save-dev @code-pushup/eslint-plugin
   ```

   ```ts
   import eslintPlugin from '@code-pushup/eslint-plugin';
   import type { CoreConfig } from '@code-pushup/models';

   const config: CoreConfig = {
     // ...
     plugins: [
       // ...
       await eslintPlugin({ eslintrc: '.eslintrc.js', patterns: ['src/**/*.js'] }),
     ],
   };

   export default config;
   ```

4. Run the CLI with `npx code-pushup` (see `--help` for list of commands and arguments).

5. View report file(s) in output directory (specified by `persist.outputDir` configuration).  
   This folder should be ignored in your `.gitignore`.

### Set up categories (optional)

1. Define your custom categories.

   ```ts
   const config: CoreConfig = {
     // ...
     categories: [
       {
         slug: 'performance',
         title: 'Performance',
         refs: [
           // reference to an existing audit or group from plugins
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

2. Run the CLI with `npx code-pushup`.

3. View report file(s) including category section in output directory.

## Portal integration

If you have access to the Code PushUp portal, provide credentials in order to upload reports.

```ts
const config: CoreConfig = {
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx code-pushup autorun --upload.apiKey=${{ secrets.PORTAL_API_KEY }}
```

## Custom Plugins

We provide comprehensive documentation on [how to create a custom plugin](./docs/custom-plugins.md).

The repository also maintains a set of plugin examples showcasing different scenarios.  
Each example is fully tested to demonstrate best practices for plugin testing as well.

**Example for custom plugins:**

- 📏 [File Size](../../examples/plugins/src/file-size)
- 📦 [Package Json](../../examples/plugins/src/package-json)
- 🔥 [Lighthouse](../../examples/plugins/src/lighthouse) (official implementation [here](../../../../packages/plugin-lighthouse))

## CLI commands and options

### Global Options

| Option           | Type      | Default                 | Description                                                            |
| ---------------- | --------- | ----------------------- | ---------------------------------------------------------------------- |
| **`--progress`** | `boolean` | `true`                  | Show progress bar in stdout.                                           |
| **`--verbose`**  | `boolean` | `false`                 | When true creates more verbose output. This is helpful when debugging. |
| **`--config`**   | `string`  | `code-pushup.config.ts` | Path to the config file, e.g. code-pushup.config.(ts\|mjs\|js)         |

> [!NOTE]  
> By default, the CLI loads `code-pushup.config.(ts|mjs|js)` if no config path is provided with `--config`.

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
> All common options, except `--onlyPlugins`, can be specified in the configuration file as well.
> CLI arguments take precedence over configuration file options.

> [!NOTE]  
> The `--upload.*` group of options is applicable to all commands except `collect`.

### Commands

#### `collect` command

<img src="./docs/images/cli-run-stdout-example.png" width="400" alt="example of code-pushup terminal output">

Usage:
`code-pushup collect [options]`

Description:
The command initializes and executes the necessary plugins and collects the results. Based on the results it generates a comprehensive report.

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
Run plugins, collect results and upload the report to the Code PushUp portal.

Refer to the [Common Command Options](#common-command-options) for the list of available options.

#### `print-config` command

Usage:
`code-pushup print-config [options]`

Description:
Print the resolved configuration.

Refer to the [Common Command Options](#common-command-options) for the list of available options.
