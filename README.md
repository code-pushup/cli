# Code PushUp CLI

[![version](https://img.shields.io/github/package-json/v/code-pushup/cli)](https://www.npmjs.com/package/%40code-pushup%2Fcli)
[![release date](https://img.shields.io/github/release-date/code-pushup/cli)](https://github.com/code-pushup/cli/releases)
[![license](https://img.shields.io/github/license/code-pushup/cli)](https://opensource.org/licenses/MIT)
[![commit activity](https://img.shields.io/github/commit-activity/m/code-pushup/cli)](https://github.com/code-pushup/cli/pulse/monthly)
[![CI](https://github.com/code-pushup/cli/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/code-pushup/cli/actions/workflows/ci.yml?query=branch%3Amain)
[![Codecov](https://codecov.io/gh/code-pushup/cli/branch/main/graph/badge.svg?token=Y7V489JZ4A)](https://codecov.io/gh/code-pushup/cli)

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

---

|                              📊 Getting Started                              |                           🌐 Portal Integration                            |                          🛠️ CI Automation                          |
| :--------------------------------------------------------------------------: | :------------------------------------------------------------------------: | :----------------------------------------------------------------: |
| **[How to setup](./packages/cli/README.md#getting-started)** a basic project | Sort, filter **[your goals](./packages/cli/README.md#portal-integration)** | Updates **[on every PR](./packages/cli/README.md#-ci-automation)** |

---

This monorepo contains code for open-source Code PushUp NPM packages:

- [📦 @code-pushup/cli](./packages/cli#readme) - **CLI** for **collecting** audit results and **uploading** report to portal
- [📦 @code-pushup/core](./packages/core#readme) - implementation of **core business logic** (useful for custom integrations)
- [📦 @code-pushup/models](./packages/models#readme) - **schemas and types** for data models (useful for custom plugins or other integrations)
- [📦 @code-pushup/utils](./packages/utils#readme) - various **utilities** (useful for custom plugins or other integrations)
- plugins:
  - [🧩 @code-pushup/eslint-plugin](./packages/plugin-eslint#readme) - static analysis using **ESLint** rules
  - [🧩 @code-pushup/coverage-plugin](./packages/plugin-coverage#readme) - code coverage analysis
  - [🧩 @code-pushup/js-packages-plugin](./packages/plugin-js-packages#readme) - package audit and outdated dependencies
  - [🧩 @code-pushup/lighthouse-plugin](./packages/plugin-lighthouse#readme) - web performance and best practices from **Lighthouse**

If you want to contribute, please refer to [CONTRIBUTING.md](./CONTRIBUTING.md).
