# @code-pushup/zod2md-nx-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Futils.svg)](https://www.npmjs.com/package/@code-pushup/zod2md-nx-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Futils)](https://npmtrends.com/@code-pushup/zod2md-nx-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/utils)](https://www.npmjs.com/package/@code-pushup/zod2md-nx-plugin?activeTab=dependencies)

Low-level **utilities** (helper functions, etc.) used by [Code PushUp CLI](../cli/README.md).

## Setup

If you've already installed another `@code-pushup/*` package, then you may have already installed `@code-pushup/zod2md-nx-plugin` indirectly.

If not, you can always install it separately:

```sh
npm install --save-dev @code-pushup/zod2md-nx-plugin
```

```sh
yarn add --dev @code-pushup/zod2md-nx-plugin
```

```sh
pnpm add --save-dev @code-pushup/zod2md-nx-plugin
```

## Usage

```ts
import { executeProcess, readJsonFile, slugify } from '@code-pushup/zod2md-nx-plugin';

await executeProcess({
  command: 'npx',
  args: ['eslint', '--format=json', '--output-file=output.json', '**/*.js'],
});

const data = await readJsonFile('output.json');

const slug = slugify('Hello, world!'); // "hello-world"
```
