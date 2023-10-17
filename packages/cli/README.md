# @code-pushup/cli

**Quality metrics for your software project. Configure what you want to track using your favourite tools, integrate it in your CI and visualize reports in a beautiful dashboard.**

The Code PushUp CLI serves to collect audit results, and optionally upload the report to the Code PushUp portal.

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
