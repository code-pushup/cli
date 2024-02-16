# @code-pushup/utils

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Futils.svg)](https://www.npmjs.com/package/@code-pushup/utils)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Futils)](https://npmtrends.com/@code-pushup/utils)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/utils)](https://www.npmjs.com/package/@code-pushup/utils?activeTab=dependencies)

Low-level **utilities** (helper functions, etc.) used by [Code PushUp CLI](../cli/README.md).

## Setup

If you've already installed another `@code-pushup/*` package, then you may have already installed `@code-pushup/utils` indirectly.

If not, you can always install it separately:

```sh
npm install --save-dev @code-pushup/utils
```

```sh
yarn add --dev @code-pushup/utils
```

```sh
pnpm add --save-dev @code-pushup/utils
```

## Usage

```ts
import { executeProcess, readJsonFile, slugify } from '@code-pushup/utils';

await executeProcess({
  command: 'npx',
  args: ['eslint', '--format=json', '--output-file=output.json', '**/*.js'],
});

const data = await readJsonFile('output.json');

const slug = slugify('Hello, world!'); // "hello-world"
```
