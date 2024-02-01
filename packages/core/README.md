# @code-pushup/core [![npm](https://img.shields.io/npm/v/%40code-pushup%2Fcore.svg)](https://www.npmjs.com/package/%40code-pushup%2Fcore)

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

---

This package contains the **core business logic** for the Code PushUp CLI.

For most use cases, you'll probably want to use the [@code-pushup/cli](../cli/README.md) package instead.
The core package is useful if you prefer programmatic usage (avoids going through the command line).

## Setup

```sh
npm install --save-dev @code-pushup/core
```

```sh
yarn add --dev @code-pushup/core
```

```sh
pnpm add --save-dev @code-pushup/core
```

## Usage

```ts
import { collect } from '@code-pushup/core';

const report = await collect({
  // ...
});
```
