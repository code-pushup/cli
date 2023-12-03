# Integrating a custom plugin in the CLI

One of the main features of Code PushUp is the ability to write custom plugins to track your own metrics.
It enables you to implement nearly any kind of metric you want to track with minimum effort.
In this section we will go through the steps to create a custom plugin and integrate it in your project.

## Setup the core config

To start crafting custom plugins you need a minimum `code-pushup.config.(ts|js|mjs)` file maintaining a `plugins` property.
property.
All plugins are registered in a core config object and can take potential options to configure its behaviour.
The following example shows where to register the plugin:

```typescript
// code-pushup.config.ts
import { create } from 'my-plugin';

export default {
  plugins: [
    // can return `PluginConfig` or `Promise<PluginConfig>`
    await create({
      // plugin options here
    }),
  ],
  categories: [],
};
```

## Plugin Structure

Every plugin is defined over a [`PluginConfig`](@TODO).

The plugin config maintains:

- metadata about the plugin
- metadata about the available audits [`Audit`](@TODO)
- internal logic producing the plugin output as [`AuditOutputs`](@TODO).

A minimal plugin object maintaining the required fields looks like the following:

**template for a custom plugin**

```typescript
// my-plugin.ts
import { AuditOutputs, PluginConfig } from '@code-pushup/models';

export const pluginMeta = {
  slug: 'my-plugin',
  title: 'My plugin',
  // icon name from [vscode-material-icon-theme](https://github.com/PKief/vscode-material-icon-theme/tree/main/icons)
  icon: 'javascript',
};

const auditMeta = {
  slug: 'my-audit',
  title: 'My audit',
};

export const audits = [auditMeta];

export type Options = {
  // your options here
};

export async function create(options: Options): PluginConfig {
  return {
    ...pluginMeta,
    audits: [auditMeta],
    runner: runnerFunction,
  };
}

function runnerFunction(): AuditOutputs {
  // Dummy audit output
  const auditOutput: AuditOutput = {
    ...auditMeta,
    score: 0,
    value: 0,
  };

  // return dummy data of type `AuditOutputs` as plugin result
  return [auditOutput];
}
```

Execute the CLI with `npx code-pushup collect` and you should the following output:

<details>
<summary> <b>stdout of CLI for the above code</b> (collapsed for brevity) </summary>

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

</details>

The categories are empty for now. But under the audit listing you can see your plugin title `My plugin`, it's listed
audit `My audit` and the resulting value `0`.

## Plugin output

Every plugin executes audits and returns outcome as [`AuditOutputs`](@TODO), and array of [`AuditOutput`](@TODO).

The minimum output of an audit looks like this:

```typescript
import { AuditOutput } from '@code-pushup/models';

const auditOutput: AuditOutput = {
  slug: 'my-audit',
  title: 'Audit title',
  score: 0,
  value: 0,
};
```

Audits are important to calculate a score out of a given metrics.
they are referenced in a category or audit group.  
Here you can read more about [audits and scoring](@TODO - in page link).

They also help with attribution of audit results. This is important to get actionable feedback like where in the code it happened or even how to fix it.  
Here you can read more on [attribution of audits](@TODO - in page link).

## Plugin runner

The core of a plugin is defined under the `runner` property.
The `runner` property is the entry point of your plugin and is called by the CLI. It should return the audit results
as [`AuditOutputs`](@TODO).

A plugins runner logic can get implemented in 2 ways:
- as a `RunnerFunction`
- as a `RunnerConfig`

Even if both of them result in [`AuditOutputs`](@TODO), we recommend the `RunnerFunction` for getting started.
It is easier to use for simple plugins and can be written in the config file directly.
The `RunnerConfig` is suitable for more complex, performance-heavy plugins (runner executed off the main thread), and is more flexible in regard to runtime (can run any shell command, not restricted to JavaScript).

### RunnerFunction

The `RunnerFunction` is the entry point of your plugin. It is called by the CLI and should return the audit results
as `AuditOutputs`.

Let's write a real implementation to get familiar with the runner function.
We will implement a simple file size audit for JavaScript files that tracks the size of specified files in your
codebase.

1. Use the template from the section [Plugin Structure](#Plugin-Structure) as a starting point and fill in the correct information for the plugin metadata.
2. Add the `directory` property to the plugin options and use the plugin in you config file.

```typescript
// code-pushup.config.ts
import {AuditOutput, AuditOutputs} from '@code-pushup/models'

// add the directory to the plugin options

const fileSizeAuditMeta: AuditOutput = {
    slug: 'file-size',
    title: 'File size',
};

async function runnerFunction(options: Options): Promise<AuditOutputs> {
    return [
        {
            ...fileSizeAuditMeta,
            value: 0,
            // helper to for a nicer displayValue
            displayValue: pluralizeToken('file', 0),
            // We have always a score of 1 for now
            score: 1,
        } satisfies AuditOutput
    ];
}
```

3. Get the raw data to perform the audit

We need the raw data to create the `AuditOutput` and calculate the metrics.
In our case we need to get the file name and size of all files in the provided directory.

The above code will recursively get the file size info for all files in the specified directory and its subdirectories.

Let's create a runner function that uses the above code to get the file size data and turns it into the shape
of `AuditOutputs`:

**file-size `RunnerFunction`**

```typescript
// code-pushup.config.ts
import {crawlFileSystem, pluralizeToken} from '@code-pushup/utils';
import {AuditOutput} from '@code-pushup/models';
import {RunnerFunction} from "./plugin-config-runner";

// ...

function runnerFunction(options: Options): RunnerFunction {
    return async (): Promise<AuditOutputs> => {

        const data = await crawlFileSystem(options, async filePath => {
            const stats = await stat(filePath);
            return {filePath, size: stats.size};
        });

        return [
            {
                ...fileSizeAuditMeta,
                value: data.length,
                displayValue: pluralizeToken('file', data.length),
                score: 1
            } satisfies AuditOutput
        ];
    }
}
```

Now we can execute the CLI with `npx code-pushup collect` and see a similar output as the following:

<details>
<summary> <b>stdout of CLI for the above code</b> (collapsed for brevity) </summary>

```sh
Code PushUp Report - @code-pushup/core@x.y.z

File size plugin audits
● File size audit                                                            2 files

Categories
┌──────────┬───────┬────────┐
│ Category │ Score │ Audits │
└──────────┴───────┴────────┘

Made with ❤ by code-pushup.dev
```

</details>

### RunnerConfig

The second way to write a plugin runner is a `RunnerConfig`.
This option is less flexible but can be used in cases when you have to use another CLI.
why runner function can't be used...

We will implement a performance focused plugin using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) as real life example.
Let's start with a `create` function maintaining the basic information of the `PluginConfig`.

<details>
<summary> <b>lighthouse plugin setup</b> (collapsed for brevity) </summary>

```typescript
// code-pushup.config.ts
import { PluginConfig, RunnerConfig } from '@code-pushup/models';

type Options = {
  url: string;
  onlyAudits: string;
};

async function create(options: Options): Promise<PluginConfig> {
  const lcpAudit = {
    slug: 'largest-contentful-paint',
    title: 'Largest Contnentful Paint',
  };

  return {
    slug: 'lighthouse',
    title: 'Chrome Lighthouse plugin',
    icon: 'lighthouse',
    audits: [
      lcpAudit,
      // other lighthouse audits
    ],
    runner: runnerConfig(options),
  };
}

function runnerConfig(options: Options): RunnerConfig {
  // implementation follows in the below section
  return {} as RunnerConfig;
}

export default {
  // ...
  plugins: [
    await create({
      url: 'https://example.com',
    }),
  ],
  // ...
};
```

</details>

The first thing we should think about is how to get the raw data.
With the Lighthouse CLI it is easy as it already provides a report file in `json` format containing a set of audits.

The lighthouse CLI can be executed like this: `npx lighthouse https://example.com`  
You should see console output of the audits created by the CLI.

To get better debugging experience we add a couple of more options:

- The format and location of the output can be configured with `--output=json --outputFile=lighthouse-report.json`.  
  This enables us to load the generated Lighthouse report while ensuring we avoid overwrites of other existing files.
- To reduce the output you can execute only specific audits with the `--onlyAudits` option
  e.g.: `--onlyAudits=largest-contentful-paint`.  
  This will significantly reduce the time lighthouse takes to run.
- If we want to run the script in the background we can execute Lighthouse in headless mode with the
  flag `--chrome-flags="--headless=new"`.  
  It also is helpful when executing Lighthouse in the CI.

The basic implementation of a `RunnerConfig` for the above command looks like this:

```typescript
// code-pushup.config.ts
// ...
import { join } from 'path';
import { AuditOutputs } from '@code-pushup/models';

function runnerConfig(options: Options): RunnerConfig {
  const { url } = options;
  // hardcoded to run only the LCP audit
  const audits = ['largest-contentful-paint'];
  const outputFile = join(process.cwd(), '.code-pushup', 'lighthouse-report.json');
  return {
    // npx lighthouse https://example.com --output=json --outputFile=lighthouse-report.json  --onlyAudits=largest-contentful-paint
    command: 'npx',
    args: objectToCliArgs({
      _: ['lighthouse', url],
      output: 'json',
      'output-path': outputFile,
      onlyAudits: audits,
    }),
    outputFile,
    outputTransform: lhrOutputTransform(audits),
  };
}

// we use a closure function for better DX in configuration
function lhrOutputTransform(audits: string[]): OutputTransform {
  return (output: string): AuditOutputs => {
    // Return dummy audit outputs.
    // Otherwise the CLI will throw an error as the lighthouse report is not of shape AuditOutputs
    return audits.map(
      slug => ({
            slug,
            value: 0,
            score: 1,
          })
    );
  };
}
```

Now we can execute the CLI with `npx code-pushup collect --no-progress` and see a similar output as the following:

<details>
<summary> <b>stdout of CLI for the above code</b> (collapsed for brevity) </summary>

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

</details>

#### Implement an `outputTransform` function

The output transform function comes in handy when you want to transform the content of `outputFile` into `AuditOutputs`.

In the current example the Lighthouse result has a different shape than the required `AuditOutputs`,  
we can use an `outputTransform` and implement the transform from a Lighthouse report to audit outputs.

**outputTransform for lighthouse report**

```typescript
// code-pushup.config.ts
import { Result } from 'lighthouse';
import { AuditOutput, AuditOutputs, OutputTransform } from '@code-pushup/models';

// ...

function lhrOutputTransform(auditSlugs: string[]): OutputTransform {
  return (output: string): AuditOutputs => {
    // output is content of `lighthouse-report.json` as string so we have to parse it
    const lhr = JSON.parse(output) as Result;

    return auditSlugs
      .filter(slug => lhr.audits[slug])
      .map(id => {
        // map lighthouse audits to code-pushup audits
        const { id: slug, score, numericValue: value = 0, displayValue } = lhr.audits[id];
        return {
          slug,
          value,
          displayValue,
          score,
        } satisfies AuditOutput;
      });
  };
}
```

Test the output by running `npx code-pushup collect --format=md`.
The CLI argument `--format=md` will create an additional file containing our created detail information form above.

You should see a newly created file `report.md` created in the folder `.code-pushup` in your current working directory.

It should contain a similar content like the following:

<details>
<summary> <b>report.md created by the CLI</b> (collapsed for brevity) </summary>

```md
### Largest Contentful Paint (Lighthouse)

🟨 <b>3.2 s</b> (score: 71)

Largest Contentful Paint marks the time at which the largest text or image is
painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)
```

</details>

## Audit Issue

To have better attribution in your audits you can use the `details` section in `AuditOutputs`.
This helps to make the plugin results more actionable and valuable for the user.

We will extend the `Options` type with a size `budget` property and see how we can use `details` in `AuditOutput` to
show which files exceed the defined budget.

**file-size plugin runnerFunction**

```typescript
// code-pushup.config.ts
// ...
import {basename} from 'path';
import {formatBytes, toUnixPath} from '@code-pushup/utils';
import {AuditOutput} from "./plugin-process-output";

async function runnerFunction(options: Options): Promise<AuditOutputs> {
    // ...

    // assert file size information with budget
    const issues = data.map(({file, size}) => assertFileSizeInfo(file, size, options.budget));

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
export function assertFileSize(file: string, size: number, budget?: number): Issue {
    const auditOutputBase = {
        source: {
            // format path to be in scope of the repository
            file: toUnixPath(file, {toRelative: true}),
        },
    } satisfies AuditOutput['source']
  
    if (budget && budget < size) {
        return {
            ...auditOutputBase,
            severity: 'error',
            message: `File ${basename(filePath)} is ${formatBytes(size - budget)} bytes too big. ( budget: ${formatBytes(budget)})`
        }
    }
    
    return {
        ...auditOutputBase,
        severity: 'info',
        message: `File ${basename(filePath)} OK`
    };
}
```

Test the output by running `npx code-pushup collect --format=md`.
The CLI argument `--format=md` will create an additional file containing our created detail information form above.
You should see a new file `report.md` created in the folder `.code-pushup` in your current working directory.
The `report.md` file should contain a similar content like the following:

<details>
<summary> <b>report.md created by the CLI</b> (collapsed for brevity) </summary>

```md
<!-- ... -->

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

</details>

## Plugins and categories

In this chapter we will see how a plugins results contribute to the category scoring. 

**lighthouse plugin**

```typescript
// code-pushup.config.ts
import { CoreConfig } from '@code-pushup/core';

export default {
  // ...
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      description: "These encapsulate your app's current performance and opportunities to improve it.",
      refs: [
        {
          type: 'audit',
          slug: 'largest-contentful-paint',
          plugin: 'lightouse',
          weight: 1,
        },
      ],
    },
  ],
} satisfies CoreConfig;
```

Test the output by running `npx code-pushup collect --no-progress`.

<details>
<summary> <b>stdout of basic lighthouse plugin</b> (collapsed for brevity) </summary>

```sh
Code PushUp Report - @code-pushup/core@x.y.z

Chrome Lighthouse audits
● Largest Contentful Paint                                                1,3 s

Categories
┌─────────────┬───────┬────────┐
│ Category    │ Score │ Audits │
├─────────────┼───────┼────────┤
│ Performance │    42 │      1 │
└─────────────┴───────┴────────┘


Made with ❤ by code-pushup.dev
```

</details>

### Score Audits

Every audit has a score as floating number between 0 and 1.
We will extend the file-size example to calculate the score based on a budget.

Let's first extend the options object with a `budget` property and use it in the runner config:

**file-size plugin form section [RunnerFunction](#RunnerFunction)**

```typescript
// code-pushup.config.ts
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

Now let's extend the runner function to calculate the score based on the budget:

**file-size plugin runnerFunction**

```typescript
// code-pushup.config.ts
// ...
import { pluralizeToken } from './formatting';
import { factorOf } from './transformation';

async function runnerFunction(options: Options): Promise<AuditOutputs> {
  // ...

  // score audit based on budget
  const errorCount = data.map(({ size }) => options.budget < size).filter(Boolean).length;
  if (errorCount) {
    fileSizeAuditOutput: AuditOutput = {
      ...fileSizeAuditOutput,
      // score is factor of over-budget files to all files
      score: factorOf(issues, errorCount),
      value: errorCount,
      displayValue: pluralizeToken('file', errorCount),
    };
  }

  return [fileSizeAuditOutput];
}
```

### Score Groups

@TODO

## Debugging custom plugins

When developing custom plugins you should know a couple of CLI options helpful when debugging.

Following options are helpful in debugging:

- use [`--verbose`](@TODO) to get more information printed in the terminal
- use [`--no-progress`](@TODO) to get better readability of logs.  
  The progressbar would otherwise interfere with your logs and makes them harder to read.
- use [`--onlyPlugin`](@TODO) will restrict the execution of plugins to only the listed ones
- use [`--config`](@TODO) to point to a different config file
- use [`--format=md`](@TODO) to see all information provided by plugin outputs
