<h1 align="center">Code PushUp CLI</h1>
<p align="center"><img alt="Code-Pushup Logo" src="./packages/cli/docs/images/logo.png" width="500" /></p>
<h2 align="center">Comprehensive tech quality monitoring</h2>
<!-- link when web landing is ready <a href="./packages/cli/README.md#getting-started">Try our paid features</a> -->
<p align="center">Quantify tech debt &mdash; Track incremental improvements &mdash; Monitor regressions</p>

---

[![version](https://img.shields.io/github/v/release/code-pushup/cli)](https://github.com/code-pushup/cli/releases/latest)
[![release date](https://img.shields.io/github/release-date/code-pushup/cli)](https://github.com/code-pushup/cli/releases)
![NodeJS support](https://img.shields.io/node/v/%40code-pushup%2Fcli)
[![license](https://img.shields.io/github/license/code-pushup/cli)](https://opensource.org/licenses/MIT)
[![commit activity](https://img.shields.io/github/commit-activity/m/code-pushup/cli)](https://github.com/code-pushup/cli/pulse/monthly)
[![CI](https://github.com/code-pushup/cli/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/code-pushup/cli/actions/workflows/ci.yml?query=branch%3Amain)
[![Codecov](https://codecov.io/gh/code-pushup/cli/branch/main/graph/badge.svg?token=Y7V489JZ4A)](https://codecov.io/gh/code-pushup/cli)

---

### 🏷️ Category labels

See how your project measures up. With [portal integration](./packages/cli/README.md#portal-integration), category scores are embeddable and always reflect your latest report.

![Type safety](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/type-safety?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Bug prevention](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/bug-prevention?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Code style](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/code-style?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Code coverage](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/code-coverage?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Security](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/security?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Updates](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/updates?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Documentation](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/docs?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)
![Axe Accessibility](https://api.staging.code-pushup.dev/badges/code-pushup/cli-workspace/axe-a11y?apiKey=cp_def67c4efe558a9149061d0c62de893e1689ad793071db332790238446173fef)

---

### 🔌 Code quality tools are like phone chargers. Everyone has a different plug.

_Common problems with keeping track of technical quality:_

- When **tech debt is invisible**, it's difficult to plan much-needed maintenance efforts 🔧
- Individual tools measure different metrics, the inability to combine them leads to a **lack of comprehensive overview** 🧑‍🦯
- Open-source tools typically used for failing checks in CI, which **can't measure incremental improvements** due to arbitrary pass/fail thresholds 🤖
- Off-the-shelf solutions tend to be opinionated and **hard to customize**, so may not fit your specific needs 🧱

_We want to change that!_

---

## 🔎🔬 Code quality integrations for any tool 📉🔍

| [🚀 Get started](./packages/cli/README.md#getting-started)️                                                                                                                                                   | [🤖 CI automation](https://github.com/marketplace/actions/code-pushup)                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a href="./packages/cli/README.md#getting-started"><img alt="Getting started cover image" title="Getting started with code-pushup" src="packages/cli/docs/images/cli-terminal-overview.png" width="1000"></a> | <a href="./packages/cli/README.md#-ci-automation"><img alt="CI Automation cover" title="CI automation guide" src="docs/images/gh-action.png" width="1000"></a>                                                                               |
| <ul><li>Run **[📦 `@code-pushup/cli`](./packages/cli#readme)** to collect **reports**.</li><li>Get started quickly with our [**official plugins**](#-officially-supported-plugins)! ⏱️</li></ul>              | <ul><li>Easy **CI** setup with **[🤖 `code-pushup/github-action`](https://github.com/marketplace/actions/code-pushup)**.</li><li>Import logic from **[📦 `@code-pushup/core`](./packages/core#readme)** to craft **custom tools**.</li></ul> |

| 📈 [Portal](https://code-pushup.dev/features)️                                                                                                                                                         | 🔌 [Custom plugins](./packages/cli/docs/custom-plugins.md)                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a href="./packages/cli/README.md#portal-integration"><img alt="Portal integration cover image" title="Integrate code-pushup portal" src="packages/cli/docs/images/portal-cover.png" width="1000"></a> | <a href="./packages/cli/docs/custom-plugins.md"><img alt="Custom plugins" title="Create custom code-pushup plugins" src="docs/images/code-pushup-custom-plugins.png" width="1000"></a>                                                                                        |
| <ul><li>**[Portal](https://code-pushup.dev/features)** 🌐 **visualizes reports** in a slick UI.</li><li>Track **historical data** from uploads. ⬆️</li></ul>                                           | <ul><li>All the [data models](./packages/models/docs/models-reference.md) you need are provided in **[📦 `@code-pushup/models`](./packages/models/README.md)**.</li><li>Find tons of useful utilities in **[📦 `@code-pushup/utils`](./packages/utils/README.md)**.</li></ul> |

---

### 🔌 Officially supported plugins

|                              Icon                              | Name                                                | Description                                                                        |
| :------------------------------------------------------------: | :-------------------------------------------------- | :--------------------------------------------------------------------------------- |
|   <img width="24" src="docs/images/plugin-eslint.icon.png">    | [ESLint](./packages/plugin-eslint#readme)           | Static analysis using **ESLint** rules.                                            |
|  <img width="24" src="docs/images/plugin-coverage.icon.png">   | [Code Coverage](./packages/plugin-coverage#readme)  | Collects code **coverage** from your tests.                                        |
| <img width="24" src="docs/images/plugin-js-packages.icon.png"> | [JS Packages](./packages/plugin-js-packages#readme) | Checks 3rd party packages for known **vulnerabilities** and **outdated** versions. |
| <img width="24" src="docs/images/plugin-lighthouse.icon.png">  | [Lighthouse](./packages/plugin-lighthouse#readme)   | Measures web performance and best practices with **Lighthouse**.                   |
|   <img width="24" src="docs/images/plugin-jsdocs.icon.png">    | [JSDocs](./packages/plugin-jsdocs#readme)           | Analyzes how much source code is **documented** using JSDocs comments.             |
| <img width="24" src="docs/images/plugin-typescript.icon.png">  | [TypeScript](./packages/plugin-typescript#readme)   | Checks for **TypeScript** errors using strict compiler flags.                      |
|     <img width="24" src="docs/images/plugin-axe.icon.png">     | [Axe](./packages/plugin-axe#readme)                 | Detects accessibility issues using **Axe**.                                        |

---

## 📝 How it works

1. **[Configure](./packages/cli/README.md#getting-started)**  
   Pick from a set of supported packages or include your own ideas. 🧩

2. **[Integrate](https://github.com/marketplace/actions/code-pushup)**  
   Use our integration guide and packages to set up CI integration in minutes. ⏱️

3. **[Observe](https://code-pushup.dev/features)**  
   Guard regressions and track improvements with every code change. 🔍

4. **Relax!**  
   Watch improvements, share reports 📈

---

## 💖 Want to support us?

- Read how to contribute to the codebase. See: [CONTRIBUTING.md](./CONTRIBUTING.md) 🤝
<!-- link when sponsorships are ready [Sponsor](./CONTRIBUTING.md) -->
