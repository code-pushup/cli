# @code-pushup/cli

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

---

The Code PushUp CLI serves to **collect audit results**, and optionally **upload the report** to the Code PushUp portal.

It can be used locally in your repository, or integrated in your CI environment.

_If you're looking for programmatic usage, then refer to the underlying [@code-pushup/core](../core/README.md) package
instead._

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
       format: ['json', 'md', 'stdout'],
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

## CI automation

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

We will implement a simple file size plugin for JavaScript files to improve the performance.

### Setup the custom plugin

To start crafting custom plugins you need a minimum `code-pushup.config.ts` file including the `persist` and `plugins`
sections.

```typescript
import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import { OnProgress } from '@code-pushup/utils';

export default {
  persist: {
    outputDir: '.code-pushup',
    format: ['json', 'md', 'stdout'],
  },
  plugins: [await createPlugin()],
  categories: [],
};

async function createPlugin(): Promise<PluginConfig> {
  const fileSizeAudit = {
    slug: 'file-size-audit',
    title: 'File Size Audit',
    description: 'Audit to check the file size of JavaScript files.',
  };
  return {
    slug: 'file-size-plugin',
    title: 'File Size Plugin',
    icon: 'javascript',
    description: 'Plugin to check the file size of JavaScript files.',
    audits: [audit1],
    runner: async (): Promise<AuditOutputs> => {
      // Run your audit here
      const fileSizeAuditOutput: AuditOutput = {
        slug: fileSizeAudit.slug,
        score: 0.5,
        value: 5,
      };
      console.log('In plugin runner');
      // return the plugin results
      return [fileSizeAuditOutput];
    },
  };
}
```

Execute the CLI with `npx code-pushup collect --no-progress` and you should the following output.
(`--no-progress` is used to get better debugging experience in the console)

```sh
Code PushUp Report - @code-pushup/core@x.y.z

File Size audits
● File Size                                                            5

Categories
┌──────────┬───────┬────────┐
│ Category │ Score │ Audits │
└──────────┴───────┴────────┘

Made with ❤ by code-pushup.dev
```

The categories are empty for now. But under the audit listing you can see you plugin title `File Size Audit` and a number.

### Plugin Runner

The `runner` function is the entry point of your plugin. It is called by the CLI and should return the audit results.

There are 2 types of plugin runner, a `RunnerFunction` and `RunnerConfig`.
Your preferred way should be the `RunnerFunction` as it is more flexible and easier to use.

#### RunnerFunction

Let's write a real implementation to get familiar with the runner function.
We will implement a simple file size audit for JavaScript files.

The first thing we should think about is how to get the raw data.
In our case we need to get the file size of all JavaScript files in a directory.

The basic implementation looks like this:

```typescript
type FileSizeOptions = {
  directory: string;
};

async function getFileSizeData(options: FileSizeOptions): Promise<{ file: string; size: number }[]> {
  const { directory } = options;

  let issues = [];
  const files = await readdir(directory);

  for (const file of files) {
    const filePath = join(directory, file);
    const stats = await stat(filePath);

    if (stats.isFile()) {
      issues.push(fileSizeInfo(filePath, stats.size));
    } else if (stats.isDirectory()) {
      issues.push(...(await fileSizePlugin({ directory: filePath })));
    }
  }

  return issues;
}

function fileSizeInfo(filePath: string, size: number) {
  return {
    file: basename(filePath),
    size,
  };
}
```

Let's also move the runner logic into a separate function and use the above implementation:

```typescript
async function fileSizeRunner(options: FileSizeOptions): Promise<AuditOutputs> {
  const data = await getFileSizeData(options);

  let fileSizeAuditOutput: AuditOutput = {
    slug: fileSizeAudit.slug,
    // TODO: calculate score
    score: 0,
    value: data.length,
    displayValue: `${data.length} ${data.length === 1 ? 'file' : pluralize('file')}`,
  };

  return [fileSizeAuditOutput];
}
```

Now we can use the runner function in our plugin:

```typescript
export default {
  // ...
  plugins: [
    await createPlugin({
      directory: 'src',
    }),
  ],
  // ...
};

async function createPlugin(options: FileSizeOptions): Promise<PluginConfig> {
  // ...
  return {
    //...
    runner: await fileSizeRunner(options),
  };
}
```

#### Add detail information to the audit output

To have better attribution in your audits you can use the `details` section in the audit output.
This helps in debugging and makes audit results more actionable.

We will use a size `budget` and see how we can use `details` to show which files are too big.

```typescript
import { Issue } from './plugin-process-output-audit-issue';

// extend the typing
type FileSizeOptions = {
  directory: string;
  budget: number;
};

export default {
  // ...
  plugins: [
    await createPlugin({
      directory: 'src',
      budget: 1000,
    }),
  ],
  // ...
};

// replace the runner function with the new logic
async function fileSizeRunner(options: FileSizeOptions): Promise<AuditOutputs> {
  const issues = await fileSizePlugin(options);

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const score = errorCount / issues.length || 0;

  let fileSizeAudit: AuditOutput = {
    slug: audit1.slug,
    score,
    value: errorCount,
    displayValue: `${errorCount} ${errorCount === 1 ? 'file' : pluralize('file')}`,
  };

  // add details if issues given
  if (issues.length) {
    fileSizeAudit = {
      ...fileSizeAudit,
      details: {
        issues,
      },
    };
  }

  return [fileSizeAudit];
}

// change return type to Issues
async function getFileSizeData(options: FileSizeOptions): Promise<Issue[]> {
  const { directory, budget } = options;
  // change type to Issues
  let issues: Issue[] = [];
  // Add budgets
  issues.push(fileSizeInfo(filePath, stats.size, budget));

  // ...
  return issues;
}

// replace the fileSizeInfo function with the new logic
function fileSizeInfo(filePath: string, size: number, budget: number): Issue {
  const sizeSmallerThanBudget = budget ? size < budget : true;
  return {
    message: `File ${basename(filePath)} is ${sizeSmallerThanBudget ? 'ok' : 'bigger than ' + formatBytes(budget)}`,
    severity: sizeSmallerThanBudget ? 'info' : 'error',
    source: {
      file: filePath,
    },
  };
}
```

Test the output by running `npx code-pushup collect` again.

### Add the plugin to the categories

```typescript
{
  // ...
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        {
          type: 'audit',
          plugin: 'file-size-plugin',
          slug: 'file-size-audit',
          weight: 1,
        },
      ],
    },
  ];
}
```
