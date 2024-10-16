# Integrating a custom plugin in the CLI

One of the main features of Code PushUp is the ability to track your own metrics by writing custom plugins.
It enables you to implement any kind of metric you want to track progress with minimum effort.
In this section we will go through the steps needed to create a custom plugin and integrate it in your project.

## Set up the core config

All plugins are registered in a core configuration, also allowing for further configuration of the plugins behavior.
Creating custom plugins requires you to create a `code-pushup.config.(ts|js|mjs)` file, that exposes a `plugins` property.
See the following example:

```typescript
// code-pushup.config.ts
import myPlugin from 'my-plugin';

export default {
  plugins: [
    // can return `PluginConfig` or `Promise<PluginConfig>`
    await myPlugin({
      // plugin options here
    }),
  ],
};
```

## Plugin Structure

Every plugin is defined in [`PluginConfig`](../../models/docs/models-reference.md#pluginconfig) object.

The plugin configuration contains:

- metadata about the plugin [`PluginMeta`](../../models/docs/models-reference.md#pluginmeta)
- metadata about the available [audit](#audits) [`Audit`](../../models/docs/models-reference.md#audit)
- a [runner](#plugin-runner) that maintains the internal logic that produces the [plugin output](#plugin-output) as [`AuditOutputs`](../../models/docs/models-reference.md#auditoutputs).
- optional [`groups`](#groups) to pre score audits

See the following example that shows a minimal implementation of a custom plugin containing all required fields:

**template for a custom plugin**

```typescript
// my-plugin.ts
import { Audit, AuditOutput, AuditOutputs, PluginConfig, PluginMeta } from '@code-pushup/models';

export const pluginMeta: PluginMeta = {
  slug: 'my-plugin',
  title: 'My plugin',
  // icon name from [vscode-material-icon-theme](https://github.com/PKief/vscode-material-icon-theme/tree/main/icons)
  icon: 'javascript',
};

const myAuditMeta: Audit = {
  slug: 'my-audit',
  title: 'My audit',
};

export const auditsMeta = [myAuditMeta];

export type Options = {
  // your options here
};

export async function create(options: Options): PluginConfig {
  return {
    ...pluginMeta,
    audits: auditsMeta,
    runner: runnerFunction(options),
  };
}

function runnerFunction(options: Options) {
  return (): AuditOutputs => {
    // Dummy audit output
    const myAuditOutput: AuditOutput = {
      ...myAuditMeta,
      score: 0,
      value: 0,
    };

    // return dummy data of type `AuditOutputs` as plugin result
    return [myAuditOutput];
  };
}

export default create;
```

Execute the CLI with `npx code-pushup collect` and you should the following output:

<details>
<summary> <b>stdout of CLI for the above code</b> (collapsed for brevity) </summary>

```sh
Code PushUp Report - @code-pushup/core@x.y.z

My plugin audits
● My audit                                                            0

Made with ❤ by code-pushup.dev
```

</details>

Under the audit listing you can see your plugin title `My plugin`, its listed audit `My audit` and the resulting value `0`.

## Plugin output

Every plugin executes audits and returns the outcome as `AuditOutputs`, which is an array of `AuditOutput`s.

The minimum output of an audit looks like this:

```typescript
import { AuditOutput } from '@code-pushup/models';

const myAuditOutput: AuditOutput = {
  ...myAuditMeta,
  score: 0,
  value: 0,
  // optional details
};
```

- An audit output always includes the metadata of the audit. [`Audit`](../../models/docs/models-reference.md#audit)

- `score` and `value` are important to calculate a score from a given metric and display it.
  Here you can read more about [audits and scoring](#audit-score).

- `details` helps with attribution of audit results. This is important to get actionable feedback like the line of code or how to fix it.  
  Here you can read more on [attribution of audits](#audit-details).

Here's an example of using the above audit for the plugin output:

```typescript
import { AuditOutputs } from '@code-pushup/models';

const pluginOutput: AuditOutputs = [myAuditOutput];
```

## Plugin runner

The `runner` property defines the core of a plugin.
It also serves as the entry point of your plugin and is executed by the CLI. It should return the audit results as [`AuditOutputs`](../../models/docs/models-reference.md#auditoutputs).

A runner can be implemented in two ways:

- as a [`RunnerFunction`](#runnerfunction)
- as a [`RunnerConfig`](#runnerconfig)

Even if both of them result in `AuditOutputs`, we recommend the `RunnerFunction` for getting started.
It is easier to use for simple plugins and can be written in the config file directly.
The `RunnerConfig` is suitable for more complex, performance-heavy plugins (runner executed off the main thread), and is more flexible in regard to runtime (can run any shell command, not restricted to JavaScript).

### RunnerFunction

The `RunnerFunction` is the entry point of your plugin. It is called by the CLI and should return the audit results
as `AuditOutputs`.

Let's write a real implementation to get familiar with the runner function.
We will implement a simple file size audit for JavaScript files that tracks the size of specified files in your
codebase.

1. Use the template from the section [Plugin Structure](#Plugin-Structure) as a starting point and fill in the correct information for the plugin metadata.
2. Add the `directory` property to the plugin options and use the plugin in your config file.

```typescript
// file-size.plugin.ts
import { AuditOutput, AuditOutputs } from '@code-pushup/models';
import { pluralizeToken } from '@code-pushup/utils';

export type Options = {
  // add the directory to the plugin options
  directory: string;
};

const fileSizeAuditMeta: AuditOutput = {
  slug: 'file-size',
  title: 'File size',
  // ...
};

async function runnerFunction(options: Options): Promise<AuditOutputs> {
  return [
    {
      slug: fileSizeAuditMeta.slug,
      value: 0,
      // helper for creating a nicer displayValue
      displayValue: pluralizeToken('file', 0),
      // We have always a score of 1 for now
      score: 1,
    } satisfies AuditOutput,
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
// file-size.plugin.ts
import { AuditOutput } from '@code-pushup/models';
import { crawlFileSystem, pluralizeToken } from '@code-pushup/utils';
import { RunnerFunction } from './plugin-config-runner';

// ...

function runnerFunction(options: Options): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    // use util to crawl the file system and transform each match into size information
    const data = await crawlFileSystem(options, async filePath => {
      const stats = await stat(filePath);
      return { filePath, size: stats.size };
    });

    return [
      {
        slug: fileSizeAuditMeta.slug,
        // number of crawled files
        value: data.length,
        // display helper for pluralisation
        displayValue: pluralizeToken('file', data.length),
        score: 0,
      } satisfies AuditOutput,
    ];
  };
}
```

Now we can execute the CLI with `npx code-pushup collect` and see a similar output:

<details>
<summary> <b>stdout of CLI for the above code</b> (collapsed for brevity) </summary>

```sh
Code PushUp Report - @code-pushup/core@x.y.z

File size plugin audits
● File size audit                                                            2 files

Made with ❤ by code-pushup.dev
```

</details>

### RunnerConfig

The second way to write a plugin runner is a `RunnerConfig`.
This option is more flexible, but at the cost of more complexity. It can be used in cases when you have to use another CLI, where a runner function can't be used.

We will implement a performance focused plugin using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) as real life example.

Let's start with a `create` function maintaining the basic information of the `PluginConfig`.

1. Use the template from the section [Plugin Structure](#Plugin-Structure) as a starting point and fill in the correct information for the plugin metadata.
2. Add the `url` and `onlyAudits` property to the plugin options and use the plugin in you config file.

<details>
<summary> <b>lighthouse plugin setup</b> (collapsed for brevity) </summary>

```typescript
// lighthouse.plugin.ts
import { AuditOutput, AuditOutputs } from '@code-pushup/models';

export type Options = {
  // add the url to the plugin options
  url: string;
  onlyAudits: string;
};

const lcpAuditMeta: AuditOutput = {
  slug: 'largest-contentful-paint',
  title: 'Largest Contnentful Paint',
  // ...
};

async function create(options: Options): Promise<PluginConfig> {
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
```

</details>

3. Get the raw data to create the audit

With the Lighthouse CLI it is easy as it already provides a report file in `json` format containing a set of audits.

The Lighthouse CLI can be executed like this: `npx lighthouse https://example.com`  
You should see console output of the audits created by the CLI.

To get the needed data we add a couple of more options:

- The format and location of the output can be configured with `--output=json --outputFile=lighthouse-report.json`.  
  This enables us to load the generated Lighthouse report while ensuring we avoid overwrites of other existing files.
- To reduce the output you can execute only specific audits with the `--onlyAudits` option
  e.g.: `--onlyAudits=largest-contentful-paint`.  
  This will significantly reduce the time Lighthouse takes to run.
- If we want to run the script in the background we can execute Lighthouse in headless mode with the
  flag `--chrome-flags="--headless=new"`.  
  It also is helpful when executing Lighthouse in the CI.

All together the command looks lie this:  
`npx lighthouse https://example.com --output=json --outputFile=.code-pushup/lighthouse-report.json  --onlyAudits=largest-contentful-paint`

The basic implementation of a `RunnerConfig` for the above command looks like this:

```typescript
// lighthouse.plugin.ts
// ...
import { join } from 'path';
import { AuditOutputs } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';

function runnerConfig(options: Options): RunnerConfig {
  const { url } = options;
  // hardcoded to run only the LCP audit
  const audits = [lcpAuditMeta.slug];
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
    return audits.map(slug => ({
      slug,
      value: 0,
      score: 1,
    }));
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

Made with ❤ by code-pushup.dev
```

</details>

#### Implement an `outputTransform` function

The output transform function comes in handy when you want to transform the content of `outputFile` into `AuditOutputs`.

In the current example the Lighthouse result has a different shape than the required `AuditOutputs`,  
we can use an `outputTransform` and implement the transform from a Lighthouse report to audit outputs.

**outputTransform for lighthouse report**

```typescript
// lighthouse.plugin.ts
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

Test the output by running `npx code-pushup collect`.
The CLI argument `--format=md` will create an additional file containing our created detail information from above.

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

## Audits

Audits are measurable metrics whose results contain score, value and additional meaningful details.

### Audit score

Every audit has a score as a floating point number between 0 and 1.
We will extend the file-size example from above to calculate the score based on a budget.

Let's extend the options object with a `budget` property and use it in the runner config:

**file-size plugin from section [RunnerFunction](#RunnerFunction)**

```typescript
// file-size.plugin.ts
// ...
import { factorOf, pluralizeToken } from '@code-pushup/utils';

// file-size.plugin.ts
type Options = {
  // ...
  budget: number; // in bytes
};

// ...

async function runnerFunction(options: Options): Promise<AuditOutputs> {
  // ...

  // score audit based on budget
  const errorCount = data.filter(({ size }) => options.budget < size).length;
  fileSizeAuditOutput: AuditOutput = {
    ...fileSizeAuditOutput,
    // score is factor of over-budget files to all files
    score: factorOf(issues, errorCount),
    value: errorCount,
    displayValue: pluralizeToken('file', errorCount),
  };

  return [fileSizeAuditOutput];
}
```

### Audit details

To have better attribution in your audits you can use the `details` section in `AuditOutputs`.
This helps to make the plugin results more actionable and valuable for the user.

We will extend the `fileSizeAuditOutput` with `details` show which files exceed the defined budget.

**file-size plugin runnerFunction**

```typescript
// file-size.plugin.ts
// ...
import { basename } from 'path';
import { formatBytes } from '@code-pushup/utils';
import { AuditOutput } from './plugin-process-output';

async function runnerFunction(options: Options): Promise<AuditOutputs> {
  // ...

  // assert file size information with budget
  const issues = data.map(({ file, size }) => assertFileSizeInfo(file, size, options.budget));

  // add issues to details
  fileSizeAuditOutput = {
    ...fileSizeAuditOutput,
    details: {
      issues,
    },
  };

  return [fileSizeAuditOutput];
}

// assert file size info with budget
export function assertFileSize(file: string, size: number, budget?: number): Issue {
  const auditOutputBase = {
    source: {
      file,
    },
  } satisfies AuditOutput['source'];

  if (budget && budget < size) {
    return {
      ...auditOutputBase,
      severity: 'error',
      message: `File ${basename(filePath)} is ${formatBytes(size - budget)} too big. ( budget: ${formatBytes(budget)})`,
    };
  }

  return {
    ...auditOutputBase,
    severity: 'info',
    message: `File ${basename(filePath)} OK`,
  };
}
```

Test the output by running `npx code-pushup collect --format=md`.
The CLI argument `--format=md` will create an additional file containing our created detail information from above.
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
      <td>File file-a.js is 17.31 kB bytes too big. (budget: 41.02 kB)</td>
      <td><code>src/file-a.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>ℹ️ <i>info</i></td>
      <td>File file-b.js OK</td>
      <td><code>src/file-b.js</code></td>
      <td></td>
    </tr>
  </table>
</details>
```

</details>

## Groups

As an optional property a plugin can maintain `groups` as an array of [`Group`s](@TODO).
While [categories](#categories) can score audits across plugins, groups are only targeting audits within a plugin.
For simple plugins this is not needed but it is beneficial in bigger plugins as audit groups also simplify the configuration.

An audit group maintains:

- metadata about the group [GroupMeta](@TODO)
- a list of referenced audits under `refs` as [GroupRef](@TODO) array

The minimum information of an audit group looks like this:

```typescript
import { Group } from '@code-pushup/models';

const myGroup: Group = {
  slug: 'performance',
  refs: [
    {
      slug: 'file-size-audit',
      weight: 1,
    },
  ],
  // optional details
};
```

The weight property of a reference is used to calculate a score for all audits listed under refs.  
A weight of 0 can be used for informative audits and a value from 1 upward to give a weight in the score compared to other audits.

## Categories

In this chapter we will see how plugin results contribute to the category scoring.

**basic category setup**
In this example we create a Performance category which contains one audit and one group.

Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

```typescript
// code-pushup.config.ts
import type { CoreConfig } from '@code-pushup/core';

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
        {
          type: 'group',
          slug: 'performance',
          plugin: 'file-size',
          weight: 1,
        },
      ],
    },
  ],
} satisfies CoreConfig;
```

Test the output by running `npx code-pushup collect`.

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

## Debugging custom plugins

When developing custom plugins you should know a couple of CLI options that are helpful when debugging.

Following options are helpful in debugging:

- use [`--config`](../README.md#global-options) to point to a different config file
- use [`--verbose`](../README.md#global-options) to get more information printed in the terminal
- use [`--no-progress`](../README.md#global-options) to get better readability of logs.  
  The progressbar would otherwise interfere with your logs and makes them harder to read.
- use [`--format=md`](../README.md#common-command-options) to see all information provided by plugin outputs
- use [`--onlyPlugin`](../README.md#common-command-options) to restrict the execution of plugins to only the listed ones
