# @code-pushup/cli

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

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

One of the main features of Code PushUp is the ability to write custom plugins to track your own metrics.
It enables you to implement neraly any kind of metric you want to track with minimum effort.
In this section we will go through the steps to create a custom plugin and integrate it in your project.

### Set up the custom plugin `create` function

To start crafting custom plugins you need a minimum `code-pushup.config.ts` file including the `persist` and `plugins`
property.

```typescript
import { AuditOutputs, PluginConfig } from '@code-pushup/models';

export default {
  persist: {
    outputDir: '.code-pushup',
  },
  plugins: [await create()],
  categories: [],
};

async function create(): PluginConfig {
  const audit = {
    slug: 'my-audit',
    title: 'My audit',
    description: 'My custom audit.',
  };
  return {
    slug: 'my-plugin',
    title: 'My plugin',
    icon: 'javascript', // icon name from [vscode-material-icon-theme](https://github.com/PKief/vscode-material-icon-theme/tree/main/icons)
    description: 'My custom plugin.',
    audits: [audit],
    runner: (): AuditOutputs => {
      // Dummy audit output
      const auditOutput: AuditOutput = {
        slug: audit.slug,
        score: 0,
        value: 0,
      };
      console.log('In plugin runner');
      // return dummy data of type `AuditOutputs` as plugin result
      return [auditOutput];
    },
  };
}
```

Execute the CLI with `npx code-pushup collect --no-progress` and you should the following output:

```sh
Code PushUp Report - @code-pushup/core@x.y.z

My plugin audits
● My audit                                                            0

Categories
┌──────────┬───────┬────────┐
│ Category │ Score │ Audits │
└──────────┴───────┴────────┘

Made with ❤ by code-pushup.dev
```

The CLI argument `--no-progress` is used to get better debugging experience in the console, as the progress bar can
interfere with debugging logs.

The categories are empty for now. But under the audit listing you can see your plugin title `My plugin` it's listed
audit `My audit` and the resulting value `0`.

### Plugin Runner

The core of a plugin is defined under the `runner` property and can get implemented in 2 ways:

- as a `RunnerFunction`
- as a `RunnerConfig`

Your preferred way should be the `RunnerFunction` as it is more flexible and easier to use.

#### RunnerFunction

The `RunnerFunction` is the entry point of your plugin. It is called by the CLI and should return the audit results
as `AuditOutputs`.

Let's write a real implementation to get familiar with the runner function.
We will implement a simple file size audit for JavaScript files that tracks the size of specified files in your
codebase.

Let's start by creating a create function with the correct description for our file size plugin:

```typescript
import { AuditOutputs, PluginConfig } from '@code-pushup/models';

async function create(): Promise<PluginConfig> {
  const fileSizeAudit = {
    slug: 'file-size-audit',
    title: 'File size audit',
    description: 'Audit to check the file size of JavaScript files.',
  };
  return {
    slug: 'file-size',
    title: 'File size plugin',
    icon: 'javascript',
    description: 'Plugin to check the file size of JavaScript files.',
    audits: [fileSizeAudit],
    // implementation follows in the below section
    runner: () => [] as AuditOutputs,
  };
}
```

The first thing we should think about is how to get the raw data to calculate the metrics.
In our case we need to get the file name and size of all files in a directory.

The basic implementation looks like this:

```typescript
type Options = {
  directory: string;
};

type FileSizeInfo = { file: string; size: number };

// get raw file size data
async function getFileSizeData(options: Options): Promise<FileSizeInfo[]> {
  const { directory } = options;

  let results = [];
  const files = await readdir(directory);

  for (const file of files) {
    const filePath = join(directory, file);
    const stats = await stat(filePath);

    // if file, get file size info
    if (stats.isFile()) {
      results.push({ filePath, size: stats.size });
    }
    // if directory, recurse
    else if (stats.isDirectory()) {
      results.push(...(await getFileSizeData({ directory: filePath })));
    } else if (stats.isDirectory()) {
      results.push(...(await fileSizePlugin({ directory: filePath })));
    }
  }

  return results;
}
```

The above code will recursively get the file size info for all files in the specified directory and it's subdirectories.

Let's create a runner function that uses the above code to get the file size data and turns it into the shape
of `AuditOutputs`:

```typescript
async function runnerFunction(options: Options): Promise<AuditOutputs> {
  const data = await getFileSizeData(options);

  let fileSizeAuditOutput: AuditOutput = {
    slug: fileSizeAudit.slug,
    // We will calculate the score and also add a display value and more details about the checked files later
    score: 0,
    value: data.length,
    // We use a helper function to pluralize the display value
    displayValue: `${data.length} ${data.length === 1 ? 'file' : pluralize('file')}`,
  };

  return [fileSizeAuditOutput];
}
```

Now we can use the runner function in our plugin as well as configure it with the `Options` object.

Let's add the `Options` object to the plugin configuration and use the created runner function:

```typescript
export default {
  // ...
  plugins: [
    await create({
      directory: './src',
    }),
  ],
  // ...
};

async function create(options: Options): Promise<PluginConfig> {
  // ...
  return {
    //...
    runner: await runnerFunction(options),
  };
}
```

Now we can execute the CLI with `npx code-pushup collect --no-progress` and see a similar output as the following:

```sh
Code PushUp Report - @code-pushup/core@x.y.z

File size plugin audits
● File size audit                                                            2

Categories
┌──────────┬───────┬────────┐
│ Category │ Score │ Audits │
└──────────┴───────┴────────┘

Made with ❤ by code-pushup.dev
```

##### Add score and detail information to the plugin output

To have better attribution in your audits you can use the `details` section in `AuditOutputs`.
This helps to make the plugin results more actionable and valuable for the user.

We will extend the `Options` type with a size `budget` property and see how we can use `details` in `AuditOutput` to
show which files exceed the defined budget.

```typescript
import { Issue } from '@code-pushup/models';

// extend the typing
type Options = {
  // ...
  budget: number; // in bytes
};

export default {
  // ...
  plugins: [
    await createPlugin({
      directory: './src',
      budget: 1000,
    }),
  ],
  // ...
};
```

Now let's extend the runner function to calculate the score and add the details:

```typescript
import { formatBytes } from '@code-pushup/utils';

async function runnerFunction(options: Options): Promise<AuditOutputs> {
  const data = await getFileSizeData(options);

  // assert file size information with budget
  const issues = data.map(fileSizeInfo => assertFileSizeInfo(fileSizeInfo, options.budget));

  // enrich output
  const errorCount = data.filter(i => i.severity === 'error').length;
  let fileSizeAuditOutput: AuditOutput = {
    slug: fileSizeAudit.slug,
    // score is factor of too big files to total files
    score: errorCount ? errorCount / issues.length : 0,
    value: errorCount,
    displayValue: `${errorCount} ${errorCount === 1 ? 'file' : pluralize('file')}`,
  };

  // add details if issues given
  if (issues.length) {
    fileSizeAuditOutput = {
      ...fileSizeAuditOutput,
      details: {
        issues,
      },
    };
  }

  return [fileSizeAuditOutput];
}

// assert file size info with budget

export function assertFileSize(
  file: string,
  size: number,
  budget?: number,
): Issue {
  let severity: IssueSeverity = 'info';
  let message = `File ${basename(filePath)} OK`;

  if (budget !== undefined) {
    // set severity to error if budget exceeded
    if(budget < size) {
        severity = 'error';
        message = `File ${basename(filePath)} is ${formatBytes(size - budget)} bytes too big. ( budget: ${formatBytes(budget)})`;
    }
  }

  return {
    message,
    severity,
    source: {
      file,
    },
  };
}
```

Test the output by running `npx code-pushup collect --no-progress --format=md`.

The CLI argument `--format=md` will create an additional file containing our created detail information form above.

You should see a newly created file `report.md` crated in the folder `.code-pushup` in your current working directory.

The `report.md` file should contain a similar content like the following:

```md
### File Size Audit (File Size)

<details>
  <summary>🟨 <b>2 files</b> (score: 50)</summary>
  <h4>Issues</h4>
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source file</th>
      <th>Line(s)</th>
    </tr>
    <tr>
      <td>🚨 <i>error</i></td>
      <td>File file-a.js is 17.31 kB bytes too big. ( budget: 41.02 kB)</td>
      <td><code>/src/file-a.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>ℹ️ <i>info</i></td>
      <td>File file-b.js OK</td>
      <td><code>/src/file-b.js</code></td>
      <td></td>
    </tr>
  </table>
</details>
```

### RunnerConfig

The second way to write a plugin runner is a `RunnerConfig`.
This option is less flexible but can be used in cases where a `RunnerFunction` is not applicable. @TODO giv an example
why runnerfunction cant be used...

We will implement a performance focused plugin using the [lighthouse](@TODO) CLI as real life example.

Let's start with a `crate` function maintaining the basic information of the `PluginConfig`.

```typescript
import { PluginConfig, RunnerConfig } from '@code-pushup/models';

async function create(): Promise<PluginConfig> {
  const lcpAudit = {
    slug: 'largest-contentful-paint',
    title: 'Largest Contnentful Paint',
    description: 'Measures the time of the largest contnentful paint of the given url',
  };

  return {
    slug: 'lighthouse',
    title: 'Chrome Lighthouse plugin',
    icon: 'lighthouse',
    description: 'Plugin to check webperformance of a given url',
    audits: [
      lcpAudit,
      // other lighthouse audits you want to provide
    ],
    // implementation follows in the below section
    runner: {} as RunnerConfig,
  };
}
```

The first thing we should think about is how to get the raw data.
With the lighthouse CLI it is ease as it already provides a report file in `json` format containing a set of audits.

The lighthouse CLI can be executed like this: `npx lighthouse https://example.com`  
You should see console output of the audits created by the CLI.

To get better debugging experience we add a couple of more options:

- The format and location of the output can be configured with `--output=json --outputFile=lighthouse-report.json`.  
  This ensures we avoid overwrites of other existing files and is needed to be able to load the generated lighthouse
  report.
- To reduce the output you can execute only specific audits with the `--onlyAudits` option
  e.g.: `--onlyAudits=largest-contentful-paint`.  
  This will significantly reduce the time lighthouse takes to run.
- If we want to run the script in the background we can execute lighthouse headless with the
  flag `--chrome-flags="--headless=new"`.  
  It also is helpfun when executing lighthouse in th CI.

The basic implementation of a `RunnerConfig` for the above command looks like this:

```typescript
import { join } from 'path';
import { AuditOutputs } from '@code-pushup/models';

type Options = {
  url: string;
  onlyAudits: string;
};

function runnerConfig(options: Options): RunnerConfig {
  const { url, onlyAudits } = options;
  const outputFile = join(process.cwd(), '.code-pushup', 'lighthouse-report.json');
  return {
    // npx lighthouse https://example.com --output=json --outputFile=lighthouse-report.json  --onlyAudits=largest-contentful-paint
    command: 'npx',
    args: objectToCliArgs({
      _: ['lighthouse', url],
      output: 'json',
      ['output-path']: outputFile,
      onlyAudits,
    }),
    outputFile,
    outputTransform: async (output: string) => {
      // return dummy audit outputs. Correct implementation follows below
      return [
        {
          slug: lcpAudit.slug,
          score: 0,
          value: 0,
        },
      ] as AuditOutputs;
    },
  };
}
```

Let's add the `Options` object to the plugin configuration and use the created runner config:

```typescript
import { runnerConfig } from './runner-config.mock';

export default {
  // ...
  plugins: [
    await create({
      url: 'https://example.com',
      onlyAudits: 'largest-contentful-paint',
    }),
  ],
  // ...
};

async function create(options: Options): Promise<PluginConfig> {
  // ...
  return {
    //...
    runner: await runnerConfig(options),
  };
}
```

Now we can execute the CLI with `npx code-pushup collect --no-progress` and see a similar output as the following:

```sh
Code PushUp Report - @code-pushup/core@x.y.z

Chrome Lighthosue audits
● Largest Contentful Paint                                                0

Categories
┌──────────┬───────┬────────┐
│ Category │ Score │ Audits │
└──────────┴───────┴────────┘

Made with ❤ by code-pushup.dev
```

#### implement a `outputTransform` function

As the result of the lighthouse run has a different shape than the required `AuditOutputs` we need to add
a `outputTransform` and implement the transform form a lighthouse report to audit outputs.

```typescript
import { Result } from 'lighthouse';
import { AuditOutputs } from './plugin-process-output';

function outputTransform(output: string): AuditOutputs {
  const lhr = JSON.parse(output as Result);
  return Object.values(lhr.audits).map(({ id: slug, score, numericValue: value, displayValue, description }) => ({
    slug,
    score: score || 0,
    value: value ? parseInt(value.toString()) : 0,
    displayValue,
    description,
  }));
}
```

We can use the plugin in our `code-psuhup.config.ts`:

```typescript
function runnerConfig(options: Options): RunnerConfig {
  // ...
  return {
    // ...
    outputTransform,
  };
}
```

Test the output by running `npx code-pushup collect --no-progress --format=md`.
The CLI argument `--format=md` will create an additional file containing our created detail information form above.

You should see a newly created file `report.md` crated in the folder `.code-pushup` in your current working directory.

It should contain a similar content like the following:

```md
### Largest Contentful Paint (Lighthouse)

🟨 <b>3.2 s</b> (score: 71)

Largest Contentful Paint marks the time at which the largest text or image is
painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)
```
